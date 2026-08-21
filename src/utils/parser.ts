export interface ParsedDescription {
  japaneseTitle?: string;
  producer?: string;
  type?: string;
  status?: string;
  genres?: string[];
  duration?: string;
  score?: string;
}

export function parseDescription(desc?: string | null): ParsedDescription {
  if (!desc) return {};

  const result: ParsedDescription = {};

  // Parse Skor
  const scoreMatch = desc.match(/Skor:\s*([0-9.]+)/i);
  if (scoreMatch) result.score = scoreMatch[1];

  // Parse Durasi
  const durationMatch = desc.match(/Durasi:\s*([0-9a-zA-Z\s]+?)(?:Skor:|$)/i);
  if (durationMatch) result.duration = durationMatch[1].trim();

  // Parse Produser
  const producerMatch = desc.match(/Produser:\s*([^Tipe:]+?)(?:Tipe:|$)/i);
  if (producerMatch) result.producer = producerMatch[1].trim();

  // Parse Tipe
  const typeMatch = desc.match(/Tipe:\s*([^Status:]+?)(?:Status:|$)/i);
  if (typeMatch) result.type = typeMatch[1].trim();

  // Parse Status
  const statusMatch = desc.match(/Status:\s*([^Genre:]+?)(?:Genre:|$)/i);
  if (statusMatch) result.status = statusMatch[1].trim();

  // Parse Genre
  const genreMatch = desc.match(/Genre:\s*([^Durasi:]+?)(?:Durasi:|$)/i);
  if (genreMatch) {
    result.genres = genreMatch[1]
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
  }

  // Parse Nama Jepang
  const jpMatch = desc.match(/Nama Jepang:\s*([^Produser:]+?)(?:Produser:|$)/i);
  if (jpMatch) result.japaneseTitle = jpMatch[1].trim();

  return result;
}

export function cleanTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/^\[(NEW Release|4K|L2D|L2D SUB INDO|SUB INDO|HD)\]\s*/i, '')
    .trim();
}

export function extractEpisodeNumber(title: string): string | null {
  const match = title.match(/Episode\s*([0-9]+)/i);
  return match ? `Ep ${match[1]}` : null;
}

/**
 * Transforms hotlink-protected or CORS-restricted image URLs (such as nekopoi.care)
 * to load via WordPress Jetpack Photon CDN (i0.wp.com) which serves images with proper CORS headers.
 */
export function getImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  let cleanUrl = url.trim();

  // If URL contains nekopoi.care and hasn't been proxied yet
  if (cleanUrl.includes('nekopoi.care') && !cleanUrl.includes('wp.com')) {
    const pathWithoutProtocol = cleanUrl.replace(/^https?:\/\//i, '');
    return `https://i0.wp.com/${pathWithoutProtocol}`;
  }

  return cleanUrl;
}
