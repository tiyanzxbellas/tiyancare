/**
 * Decodes the transport envelope used by the current DoujinDesu web client.
 *
 * This only reverses the public response obfuscation. Authentication and
 * upstream access checks still happen normally on the server.
 */

const KEY_SALT = 'doujindesu-scrapers-cannot-read-this-super-secret-salt-2026-v2';
const HOUR_MS = 60 * 60 * 1000;
const KEY_LENGTH = 32;
const HEX_BYTES = /^(?:[0-9a-f]{2})+$/i;

function hourlyKey(hour: number): string {
  let hash = 0;
  for (const character of `${KEY_SALT}_${hour}`) {
    // Bitwise operations intentionally reproduce JavaScript's signed 32-bit
    // overflow from the upstream client.
    hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  }

  let state = hash === 0 ? 123456789 : Math.abs(hash);
  let key = '';
  for (let index = 0; index < KEY_LENGTH; index += 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    key += String.fromCharCode(33 + (state % 93));
  }
  return key;
}

function rollingXor(encryptedHex: string, key: string): string {
  const characters = new Array<string>(encryptedHex.length / 2);
  let accumulator = 42;

  for (let index = 0; index < characters.length; index += 1) {
    const encryptedByte = Number.parseInt(encryptedHex.slice(index * 2, index * 2 + 2), 16);
    const decodedByte =
      encryptedByte ^
      key.charCodeAt(index % key.length) ^
      (index * 13) ^
      accumulator;

    characters[index] = String.fromCharCode(decodedByte & 0xff);
    accumulator = (accumulator + encryptedByte) % 256;
  }

  return characters.join('');
}

/**
 * Decode an `_enc_resp_` ciphertext and parse its JSON payload.
 *
 * DoujinDesu rotates the generated key every Unix hour. Adjacent-hour keys
 * account for clock skew and requests that cross an hour boundary. A key is
 * accepted only after URI decoding and JSON parsing both succeed.
 */
export function decodeDoujinDesuResponse(
  encryptedHex: string,
  now: number = Date.now()
): unknown {
  if (!HEX_BYTES.test(encryptedHex)) {
    throw new Error('DoujinDesu returned an invalid encrypted response.');
  }

  const currentHour = Math.floor(now / HOUR_MS);
  const candidateHours = [currentHour, currentHour - 1, currentHour + 1];

  for (const hour of candidateHours) {
    try {
      const encodedJson = rollingXor(encryptedHex, hourlyKey(hour));
      const json = decodeURIComponent(encodedJson);
      return JSON.parse(json) as unknown;
    } catch {
      // A wrong hourly key normally produces malformed URI data or JSON.
    }
  }

  throw new Error(
    'Respons terenkripsi DoujinDesu gagal dibaca. Format API mungkin telah berubah; coba lagi nanti.'
  );
}
