import re
import os
from pathlib import Path

FRONTEND_ROOT = Path(__file__).resolve().parent.parent
STITCH = FRONTEND_ROOT / "assets" / "stitch"

target_files = [
    STITCH / "shop_home___prd___reference_aligned.html",
    STITCH / "sessions_list_view___standardized_refined.html",
    STITCH / "sessions_calendar_view___with_toggle.html",
    STITCH / "account.html",
]

with open(STITCH / "home_dashboard___final_branding.html", "r") as f:
    home_content = f.read()

# Extract the bottom nav from home dashboard
nav_match = re.search(r'<nav class="md:hidden fixed bottom-0.*?</nav>', home_content, re.DOTALL)
if not nav_match:
    print("Could not find bottom nav in home dashboard")
    exit(1)

nav_html = nav_match.group(0)

# Replace in target files
for file_path in target_files:
    if not file_path.exists():
        print(f"File not found: {file_path}")
        continue
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Try to find the bottom nav in the target file
    # It might be <nav class="md:hidden fixed bottom-0... or similar
    # Let's just look for <nav class=".*bottom-0.*?</nav>
    target_match = re.search(r'<nav[^>]*bottom-0[^>]*>.*?</nav>', content, re.DOTALL)
    if target_match:
        content = content[:target_match.start()] + nav_html + content[target_match.end():]
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Updated {file_path}")
    else:
        print(f"Could not find bottom nav in {file_path}")
