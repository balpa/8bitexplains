#!/usr/bin/env bash
# Quick look without a full render: stills at the given seconds, tiled into out/<id>-preview.png.
# Usage: tools/preview.sh ep005 1 5 12 20
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ID="$1"; shift
BUNDLE="$(mktemp -d)"; SHOTS="$(mktemp -d)"
PORT=8771
(cd "$ROOT/remotion" && ./node_modules/.bin/remotion bundle src/index.ts --out-dir="$BUNDLE" >/dev/null)
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$BUNDLE" >/dev/null 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null; rm -rf "$BUNDLE" "$SHOTS"' EXIT
sleep 1
for s in "$@"; do
  f=$(python3 -c "print(round(float('$s') * 30))")
  (cd "$ROOT/remotion" && ./node_modules/.bin/remotion still "http://127.0.0.1:$PORT" "$ID" "$SHOTS/$(printf '%06d' "$f").png" --frame="$f" >/dev/null)
done
"$ROOT/tools/.venv/bin/python" -I - "$SHOTS" "$ROOT/out/$ID-preview.png" <<'PY'
import sys
from pathlib import Path
from PIL import Image
files = sorted(Path(sys.argv[1]).glob("*.png"))
cols = min(4, len(files)); rows = -(-len(files) // cols)
sheet = Image.new("RGB", (cols * 360, rows * 640), (5, 4, 15))
for i, f in enumerate(files):
    sheet.paste(Image.open(f).convert("RGB").resize((360, 640)), ((i % cols) * 360, (i // cols) * 640))
sheet.save(sys.argv[2])
PY
echo "out/$ID-preview.png"
