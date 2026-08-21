import urllib.request
import re

def test_streampoi(url):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://nekopoi.care/'
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8')
    except Exception as e:
        print('Fetch error:', e)
        return

    # Look for Dean Edwards p.a.c.k.e.r
    # eval(function(p,a,c,k,e,d)...}('...', 36, 123, '...'.split('|'), 0, {}))
    m = re.search(r"eval\(function\(p,a,c,k,e,d\).+?\}\('(.*?)',\s*(\d+),\s*(\d+),\s*'(.*?)'\.split\('\|'\)", html, re.DOTALL)
    if m:
        p_arg, a_arg, c_arg, k_arg = m.groups()
        a = int(a_arg)
        c = int(c_arg)
        k = k_arg.split('|')
        
        def baseN(num, b):
            chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
            res = ''
            while num > 0:
                res = chars[num % b] + res
                num //= b
            return res or '0'
        
        k_dict = {}
        for idx in range(c):
            key_repr = baseN(idx, a) if a > 10 else str(idx)
            val = k[idx] if idx < len(k) and k[idx] else key_repr
            k_dict[key_repr] = val

        def repl(match):
            w = match.group(0)
            return k_dict.get(w, w)

        unpacked = re.sub(r'\b\w+\b', repl, p_arg)
        print("Unpacked preview:", unpacked[:400])

        # Extract file / sources:
        sources = re.findall(r'https?://[^\s"\'<>]+\.(?:m3u8|mp4)[^\s"\'<>]*', unpacked)
        print("Extracted Direct Video Stream Sources:", sources)
        return sources
    else:
        print("No packed script found")

test_streampoi('https://streampoi.com/embed-yp8tsp1lwiuu.html')
