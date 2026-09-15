#!/usr/bin/env python3
"""Organize Figma library dump + flat screen images into per-screen folders.

Source dump: `frontend/design/figma/exports/library/` (legacy: repo-root `figma_assets/`).
Idempotent: skips copies when the destination already exists.
Does not delete dump files.
"""

from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DUMP_CANDIDATES = (
    ROOT / "frontend" / "design" / "figma" / "exports" / "library",
    ROOT / "figma_assets",
)
DUMP = next((p for p in DUMP_CANDIDATES if p.is_dir()), DUMP_CANDIDATES[0])
FIGMA = ROOT / "frontend" / "assets" / "figma"
IMAGES = ROOT / "frontend" / "assets" / "images" / "screens"
ANIM = ROOT / "frontend" / "assets" / "animations"

# dump relative path → destination under frontend/assets/figma/
DUMP_MAP: dict[str, str] = {
    # Onboarding
    "Apple Icon.svg": "onboarding/apple-icon.svg",
    "google.svg": "onboarding/google-icon.svg",
    "Email Icon.svg": "onboarding/email-icon.svg",
    "US - United States.svg": "onboarding/us-flag.svg",
    "underline.svg": "onboarding/welcome-underline.svg",
    "question.svg": "onboarding/question-icon.svg",
    "react-icons/ai/AiOutlineQuestion.svg": "onboarding/question-icon.svg",
    "CleanUpGiveBack.svg": "shared/brand-mark.svg",
    "bell.svg": "onboarding/notif-bell.svg",
    "notif.svg": "shared/notif-glyph.svg",
    "check.svg": "shared/check.svg",
    "checkmark.svg": "shared/checkmark.svg",
    "decoration.svg": "shared/decoration.svg",
    # Tour
    "star.svg": "shared/star-solid.svg",
    "stars.svg": "tour/star-set.svg",
    "react-icons/md/MdOutlineReplay.svg": "tour/replay.svg",
    "Streak Icon.svg": "home-screen/streak-icon.svg",
    # Home dashboard
    "Stat Icon.svg": "home-screen/stat-icon.svg",
    "Notification Icon.svg": "home-screen/notification-icon.svg",
    "Calendar icon filled.svg": "home-screen/calendar-filled.svg",
    "Date Icon.svg": "home-screen/date-icon.svg",
    "Time Icon.svg": "home-screen/time-icon.svg",
    "Event Location Icon.svg": "home-screen/event-location.svg",
    "Event Organization Icon.svg": "home-screen/event-organization.svg",
    "Locations Icon.svg": "home-screen/locations-icon.svg",
    "Next Week Icon.svg": "home-screen/next-week.svg",
    "Previous Week Icon.svg": "home-screen/previous-week.svg",
    "Track Icon Container.svg": "home-screen/track-cta.svg",
    "leaf.svg": "home-screen/leaf.svg",
    "email.svg": "home-screen/email.svg",
    # Event detail
    "Clothing icon.svg": "event-detail/clothing.svg",
    "Shoes icon.svg": "event-detail/shoes.svg",
    "Water bottle icon.svg": "event-detail/water-bottle.svg",
    "Copy icon.svg": "event-detail/copy.svg",
    "Share icon.svg": "event-detail/share.svg",
    "Facebook icon.svg": "event-detail/facebook.svg",
    "Instagram icon.svg": "event-detail/instagram.svg",
    "YouTube icon.svg": "event-detail/youtube.svg",
    "calendar.svg": "event-detail/calendar.svg",
    "Calendar Icon.svg": "session-setup/calendar.svg",
    # Session setup
    "react-icons/io/IoIosInformationCircle.svg": "session-setup/info-circle.svg",
    # Live session
    "My Location Icon.svg": "live-session/my-location.svg",
    "Temperature Icon Container.svg": "live-session/weather.svg",
    "camera.svg": "live-session/submit-photo-camera.svg",
    "react-icons/md/MdOutlinePhotoCamera.svg": "live-session/submit-photo-camera.svg",
    "react-icons/bs/BsStopCircle.svg": "live-session/end-session-stop.svg",
    "Location Icon.svg": "home-screen/location-icon.svg",
    # Sessions list
    "Expand Icon.svg": "sessions-list/expand.svg",
    "Ellipse 1.svg": "sessions-list/ellipse.svg",
    "react-icons/gr/GrSearch.svg": "sessions-list/react-icons/gr/GrSearch.svg",
    "react-icons/hi/HiOutlineChevronUp.svg": "sessions-list/react-icons/hi/HiOutlineChevronUp.svg",
    "react-icons/bi/BiExpandAlt.svg": "sessions-list/react-icons/bi/BiExpandAlt.svg",
    # Sessions calendar
    "react-icons/bs/BsListCheck.svg": "sessions-calendar/list-check.svg",
    # Session detail
    "Photos Icon.svg": "session-detail/photos.svg",
    "Icon.svg": "shared/generic-icon.svg",
    # Account
    "approval.svg": "account/approval.svg",
    "chevron-right.svg": "account/chevron-right.svg",
    "Copyright Icon.svg": "account/copyright.svg",
    "data.svg": "account/data.svg",
    "donation.svg": "account/donation.svg",
    "export.svg": "account/export.svg",
    "folder.svg": "account/folder.svg",
    "leaves.svg": "account/leaves.svg",
    "leaf-large.svg": "account/leaf-large.svg",
    "leaf-small.svg": "account/leaf-small.svg",
    "notification.svg": "account/notification.svg",
    "permissions.svg": "account/permissions.svg",
    "preferences.svg": "account/preferences.svg",
    "privacy.svg": "account/privacy.svg",
    "shop.svg": "account/shop.svg",
    "react-icons/io5/IoLogOut.svg": "account/react-icons/io5/IoLogOut.svg",
    "react-icons/md/MdDelete.svg": "account/react-icons/md/MdDelete.svg",
    "react-icons/md/MdApproval.svg": "account/react-icons/md/MdApproval.svg",
    "react-icons/bs/BsExclamationTriangleFill.svg": "account/react-icons/bs/BsExclamationTriangleFill.svg",
    "react-icons/ri/RiAlertFill.svg": "account/react-icons/ri/RiAlertFill.svg",
    "react-icons/gr/GrResources.svg": "account/react-icons/gr/GrResources.svg",
    # Shop — prefer subfolders; root shop/_source holds ported glyph originals
    "Cart Icon.svg": "shop/_source/cart-icon.svg",
    "Featured Item Cart Icon.svg": "shop/_source/featured-cart-icon.svg",
    "Donate Icon.svg": "shop/_source/donate-icon.svg",
    "Stripe Logo.svg": "shop/cart/stripe-logo.svg",
    "crown.svg": "shop/donate/crown.svg",
    "recycle.svg": "shop/donate/recycle.svg",
    "heart_background.svg": "shop/donate/heart-bg.svg",
    "hearts.svg": "shop/confirmation/hearts.svg",
    "heart1.svg": "shop/confirmation/heart1.svg",
    "heart2.svg": "shop/confirmation/heart2.svg",
    "heart3.svg": "shop/confirmation/heart3.svg",
    "plus.svg": "shop/cart/plus.svg",
    "minnus.svg": "shop/cart/minus.svg",
    "react-icons/ri/RiHeartFill.svg": "shop/cart/heart-fill.svg",
    # Shared leftovers
    "Vector.svg": "shared/vector-1.svg",
    "Vector2.svg": "shared/vector-2.svg",
    "Vector3.svg": "shared/vector-3.svg",
    "Vector4.svg": "shared/vector-4.svg",
}

# Animations from dump → assets/animations (only if missing)
ANIM_MAP: dict[str, str] = {
    "Missed.json": "missed-checkpoint.json",
    "submitted.json": "photo-submitted.json",
    "GIF.json": "photo-submitted-lottie.json",
    "TuZanFlZp9.gif": "photo-submitted-alt.gif",
    "8y5dOCoScB.gif": "photo-submitted-alt-2.gif",
}

# Flat images/screens → per-flow subfolders
IMAGE_MOVES: dict[str, str] = {
    "session-setup-guide-illustration.png": "session-setup/guide-illustration.png",
    "session-setup-step2-illustration.png": "session-setup/step2-illustration.png",
    "session-setup-step3-illustration.png": "session-setup/step3-illustration.png",
    "session-setup-step4-illustration.png": "session-setup/step4-illustration.png",
    "session-setup-step5-illustration.png": "session-setup/step5-illustration.png",
    "session-setup-complete-star.png": "session-setup/complete-star.png",
    "session-setup-complete-smiley.png": "session-setup/complete-smiley.png",
    "camera-permission-graphic.png": "permissions/camera-graphic.png",
    "location-permission-pin.png": "permissions/location-pin.png",
    "photo-checkpoint-background.png": "photo-checkpoint/background.png",
    "photo-submitted-background.png": "photo-submitted/background.png",
    "missed-checkpoint-background.png": "missed-checkpoint/background.png",
    "submission-photo-1.png": "submission-confirmation/photo-1.png",
    "submission-photo-2.png": "submission-confirmation/photo-2.png",
    "submission-photo-3.png": "submission-confirmation/photo-3.png",
    "submission-photo-4.png": "submission-confirmation/photo-4.png",
}

# Shop root source glyphs (ported to RN) → shop/_source/
SHOP_SOURCE = [
    "cart-icon.svg",
    "featured-cart-icon.svg",
    "donate-icon.svg",
    "streak-icon.svg",
    "donate-bg-heart.png",
    "donate-bg-wave.svg",
    "donate-circle-icon.png",
]


def ensure_copy(src: Path, dest: Path) -> str:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        return f"skip  {dest.relative_to(ROOT)}"
    shutil.copy2(src, dest)
    return f"copy  {src.relative_to(ROOT)} → {dest.relative_to(ROOT)}"


def ensure_move(src: Path, dest: Path) -> str:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not src.exists():
        return f"miss  {src.relative_to(ROOT)}"
    if dest.exists():
        src.unlink()
        return f"dedupe {src.name} (kept {dest.relative_to(ROOT)})"
    shutil.move(str(src), str(dest))
    return f"move  {src.relative_to(ROOT)} → {dest.relative_to(ROOT)}"


def main() -> None:
    logs: list[str] = []

    for rel_src, rel_dest in DUMP_MAP.items():
        src = DUMP / rel_src
        if not src.exists():
            logs.append(f"miss  {DUMP.name}/{rel_src}")
            continue
        logs.append(ensure_copy(src, FIGMA / rel_dest))

    for rel_src, rel_dest in ANIM_MAP.items():
        src = DUMP / rel_src
        if not src.exists():
            continue
        logs.append(ensure_copy(src, ANIM / rel_dest))

    # Keep GIF.mov out of bundled assets — design export only (handled by relocate)
    for name, dest_rel in IMAGE_MOVES.items():
        src = IMAGES / name
        dest = IMAGES / dest_rel
        if dest.exists() and not src.exists():
            continue
        logs.append(ensure_move(src, dest))

    source_dir = FIGMA / "shop" / "_source"
    for name in SHOP_SOURCE:
        src = FIGMA / "shop" / name
        if src.exists():
            logs.append(ensure_move(src, source_dir / name))

    # Empty screen stub folders for flows that use images/animations only
    for folder in (
        "sessions-calendar",
        "photo-checkpoint",
        "photo-submitted",
        "missed-checkpoint",
        "submission-confirmation",
        "shared",
        "permissions",
    ):
        (FIGMA / folder).mkdir(parents=True, exist_ok=True)

    # Symlink-style README placeholders pointing image-only screens to images/
    for folder, note in {
        "photo-checkpoint": "Raster: `assets/images/screens/photo-checkpoint/`",
        "photo-submitted": "Raster + animation: `images/screens/photo-submitted/` + `animations/photo-submitted-success.gif`",
        "missed-checkpoint": "Raster + Lottie: `images/screens/missed-checkpoint/` + `animations/missed-checkpoint.json`",
        "submission-confirmation": "Mock photos: `images/screens/submission-confirmation/`",
        "permissions": "Permission graphics: `images/screens/permissions/`",
    }.items():
        readme = FIGMA / folder / "README.md"
        if not readme.exists():
            readme.write_text(f"# {folder}\n\n{note}\n", encoding="utf-8")
            logs.append(f"write {readme.relative_to(ROOT)}")

    print("\n".join(logs))
    print(f"\nDone. {len(logs)} actions.")


if __name__ == "__main__":
    main()
