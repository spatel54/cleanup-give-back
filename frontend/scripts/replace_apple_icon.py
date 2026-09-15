import os
import re

svg_content = '''<svg class="w-5 h-5 fill-current" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
<path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
</svg>'''

files_to_check = [
    '/Users/shivpat/CleanUpGiveBackApp/stitch_htmls/welcome.html',
    '/Users/shivpat/CleanUpGiveBackApp/stitch_htmls/welcome___standardized_progress.html'
]

for file_path in files_to_check:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the SVG that comes right before "Continue with Apple"
    # We will use regex to replace the SVG block.
    # The SVG might have different classes, but it is before "Continue with Apple"
    
    # regex: match <svg ...>...</svg> that is followed by whitespace and "Continue with Apple"
    pattern = re.compile(r'<svg[^>]*>.*?</svg>(?=\s*Continue with Apple)', re.DOTALL)
    
    new_content, count = pattern.subn(svg_content, content)
    
    if count > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Replaced Apple SVG in {file_path}")
    else:
        print(f"Could not find Apple SVG in {file_path}")
