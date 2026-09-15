#!/usr/bin/env bash
# Reminds the agent to update living docs after source edits (fail-open).
set -euo pipefail

input=$(cat)

python3 - <<'PY' "$input"
import json
import sys

raw = sys.argv[1] if len(sys.argv) > 1 else ""
if not raw.strip():
    sys.exit(0)

try:
    payload = json.loads(raw)
except json.JSONDecodeError:
    sys.exit(0)

paths: list[str] = []

def add_path(value: object) -> None:
    if isinstance(value, str) and value.strip():
        paths.append(value.replace("\\", "/"))

for key in ("file_path", "path", "filePath", "edited_file", "editedFile"):
    add_path(payload.get(key))

for key in ("files", "edited_files", "editedFiles", "paths"):
    value = payload.get(key)
    if isinstance(value, list):
        for item in value:
            if isinstance(item, str):
                add_path(item)
            elif isinstance(item, dict):
                for k in ("path", "file_path", "filePath"):
                    add_path(item.get(k))

if not paths:
    sys.exit(0)

LIVING_DOC_MARKERS = (
    "/docs/",
    "README.md",
    ".cursor/rules/",
)

SCOPE_MAP = {
    "app": "docs/frontend/context/app.md",
    "assets": "docs/frontend/context/assets.md",
    "components": "docs/frontend/context/components.md",
    "hooks": "docs/frontend/context/hooks.md",
    "constants": "docs/frontend/context/constants.md",
}

SOURCE_SUFFIXES = (".ts", ".tsx", ".js", ".jsx")
ASSET_SUFFIXES = (".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".ttf", ".otf", ".woff", ".woff2")

def is_living_doc(path: str) -> bool:
    return any(marker in path for marker in LIVING_DOC_MARKERS)

def rel_under_frontend(path: str) -> str | None:
    rel = path.lstrip("./")
    if rel.startswith("frontend/"):
        return rel[len("frontend/"):]
    return None

def top_scope(path: str) -> str | None:
    rel = rel_under_frontend(path)
    if rel is None:
        return None
    parts = rel.split("/")
    if len(parts) < 2:
        return None
    if parts[0] == "src" and len(parts) >= 3:
        scope = parts[1]
        return scope if scope in SCOPE_MAP else None
    if parts[0] == "assets":
        return "assets"
    return None

def is_source_code(path: str) -> bool:
    rel = rel_under_frontend(path)
    if rel is None:
        return False
    if top_scope(path) is None:
        return False
    return rel.endswith(SOURCE_SUFFIXES) and "/__tests__/" not in rel

def is_asset_file(path: str) -> bool:
    rel = rel_under_frontend(path)
    if rel is None:
        return False
    rel_lower = rel.lower()
    if not rel_lower.startswith("assets/"):
        return False
    return rel_lower.endswith(ASSET_SUFFIXES)

edited_source = [p for p in paths if is_source_code(p)]
edited_assets = [p for p in paths if is_asset_file(p)]
if not edited_source and not edited_assets:
    sys.exit(0)

if any(is_living_doc(p) for p in paths):
    sys.exit(0)

scopes = sorted({
    SCOPE_MAP[top_scope(p)]  # type: ignore[index]
    for p in edited_source + edited_assets
    if top_scope(p)
})

scope_text = ", ".join(f"`{s}`" for s in scopes)

message = (
    "Documentation backpressure: source edited without a docs update in the same turn. "
    "Follow `.cursor/rules/docs-backpressure.mdc` — update "
    f"{scope_text}, `docs/frontend/context/project.md`, and `docs/implementation-plan.md` / relevant `docs/*/specs/*.md` if applicable."
)

print(json.dumps({"additional_context": message}))
PY
