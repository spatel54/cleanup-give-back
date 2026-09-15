import os
import re
import base64
import urllib.request
import ssl
from pathlib import Path

# Paths (relative to frontend/)
FRONTEND_ROOT = Path(__file__).resolve().parent.parent
source_dir = FRONTEND_ROOT / "design" / "stitch_htmls"
target_dir = FRONTEND_ROOT / "assets" / "stitch"

target_dir.mkdir(parents=True, exist_ok=True)

# Regex to find img src and background-image url
# It matches src="https://..." and url('https://...')
url_pattern = re.compile(r'(src="([^"]+)"|url\([\'"]?([^\'"()]+)[\'"]?\))')

def get_base64(url):
    if not url.startswith("http"):
        return url
    
    # Ignore fonts and tailwind
    if "fonts.googleapis.com" in url or "cdn.tailwindcss.com" in url or "fonts.gstatic.com" in url:
        return url

    print(f"Downloading {url[:50]}...")
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
            data = response.read()
            b64 = base64.b64encode(data).decode('utf-8')
            
            # basic mime type guessing
            mime = "image/jpeg"
            if url.endswith(".png"): mime = "image/png"
            elif url.endswith(".svg"): mime = "image/svg+xml"
            elif url.endswith(".gif"): mime = "image/gif"
            
            return f"data:{mime};base64,{b64}"
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return url

for filename in os.listdir(source_dir):
    if not filename.endswith(".html"):
        continue
        
    filepath = source_dir / filename
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    def replace_match(match):
        full_match = match.group(0)
        if match.group(2): # src="url"
            url = match.group(2)
            new_url = get_base64(url)
            return f'src="{new_url}"'
        elif match.group(3): # url('url')
            url = match.group(3)
            new_url = get_base64(url)
            return f"url('{new_url}')"
        return full_match

    new_content = url_pattern.sub(replace_match, content)
    
    target_filepath = target_dir / filename
    with open(target_filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print(f"Processed {filename}")

print("Done processing all HTML files.")
