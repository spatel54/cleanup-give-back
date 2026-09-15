import json

with open('stitch_screens.json', 'r') as f:
    data = json.load(f)

text_content = data['result']['content'][0]['text']
screens_data = json.loads(text_content)

for screen in screens_data['screens']:
    print(f"Name/ID: {screen.get('name')}")
    print(f"Title: {screen.get('title')}")
    html_code = screen.get('htmlCode', {})
    if 'downloadUrl' in html_code:
        print(f"Has HTML URL: True")
    print("---")
