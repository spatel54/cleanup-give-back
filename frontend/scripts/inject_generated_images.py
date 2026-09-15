import os
import glob
import base64

assets_dir = "/Users/shivpat/CleanUpGiveBack App Development/nonprofit-mobile-app/assets/stitch"
html_files = glob.glob(os.path.join(assets_dir, "*.html"))

# Map the failing URLs to the generated image paths
image_map = {
    "https://lh3.googleusercontent.com/aida/AP1WRLuwuXn67cxDiw3VhRRlEXUOY_WV1qlbLtx4v-BGRXB0w6jIQUqdNwtP3BzFh-EwyvEZdonCXUNt1WpSWfOZVznsJLfawaTN1gj3o0USdcuqQs56sCVOc6i0iHSteCC4AtaKHDsMNXhBMcXJMgy_Gtz7hbdOzNFOUPAVhVEcafd0v1LIciRYzSGd__wAwbg4pwLlIW2pqv_RUz_dX3yQwJUnYFpkRzqFJE0vt_aGyc5BMpbDxafdKYQ3_sU": "/Users/shivpat/.gemini/antigravity-ide/brain/a8069383-7b96-451d-8c86-ef6100ef70da/trash_cleanup_kit_1780797227678.png",
    "https://lh3.googleusercontent.com/aida/AP1WRLuVugvK242RUdA_iWF4GjrHHlsiDMAKmf0eaGW9cZeRNJ2fpjHQVBXBp1M6bRP9_wYoYdFfHWmXiipvrAMtgygzYsB-4-YKn0kXGfMup7cQONM-M2VXnl2PL07FAY6hiXjQkMZYNCVaL_KxcYAudRdHTqk40BTmPUblgw2Z59UyDVt4Gwo_pBVVWU9R45sZZ976o541w9KkvIcb5k2MenYtd6s88AuNujrxMmdFNuQx3TAaxV02mt7vWH8": "/Users/shivpat/.gemini/antigravity-ide/brain/a8069383-7b96-451d-8c86-ef6100ef70da/trash_grabber_1780797237592.png",
    "https://lh3.googleusercontent.com/aida/AP1WRLtVqMKOHcOQ434u399a_7wJ269D9qV4JTAPbFazcHBEwIi9RqgWnUVdpVx4SB6PMPKdTtsh_kBQp66bssqZDJZmC3NjPJgpqilTanI5Msuq31WpIT2AK9DzuJxDkb34aHHSi8yaSD1Pk3VNs4KAFOll0Jw-9g60kcdOmBT6M9gY8Km_arOpjkni3R7NqocvlvHrUUI5bBVD-Zitw2Vg3lYtT-F1FiqD2l_mrHdMvlQb2jT9pOfeTj-DuVY": "/Users/shivpat/.gemini/antigravity-ide/brain/a8069383-7b96-451d-8c86-ef6100ef70da/cleanup_route_map_1780797248380.png",
    "https://lh3.googleusercontent.com/aida/AP1WRLtkdNA2U_M9R83pPDuSJ6TT3ZxYdRNzhQtOWWcDuh5J-ZpJo0ja5QdnvtPoc9Vts2IsjVslerK5KTjo5oR8iN5lJyZcxfgP4PGFespQSbyXTM6weZkI1etKDdosxeqPL7Oad42DzQQ_Jjw-HV9PDIkwULl8CKocfLB7y7U0pzE0y74qHTigFYYuNiiqIB38dl9GWk7SSJHaRJzn0MmEGsHF1CYLXww21t_oFZF0Ws4wh0zHljMHt6zr_gc": "/Users/shivpat/.gemini/antigravity-ide/brain/a8069383-7b96-451d-8c86-ef6100ef70da/welcome_hero_pattern_1780797257901.png"
}

# Pre-compute the base64 strings
b64_map = {}
for url, path in image_map.items():
    if os.path.exists(path):
        with open(path, "rb") as img_file:
            encoded_string = base64.b64encode(img_file.read()).decode('utf-8')
            b64_map[url] = f"data:image/png;base64,{encoded_string}"
    else:
        print(f"File not found: {path}")

# Replace in all HTML files
for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False
    for url, b64_str in b64_map.items():
        if url in content:
            content = content.replace(url, b64_str)
            changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")

print("Image injection complete.")
