#!/usr/bin/env bash
# Usage: ./build.sh episodes/001-super-el-nino.json
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
EPISODE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
ID="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["id"])' "$EPISODE")"
MODELS="https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"

if [ ! -x "$ROOT/tools/.venv/bin/python" ]; then
  uv venv --python 3.12 "$ROOT/tools/.venv"
  uv pip install --python "$ROOT/tools/.venv/bin/python" -r "$ROOT/tools/requirements.txt"
fi

mkdir -p "$ROOT/models"
[ -f "$ROOT/models/kokoro-v1.0.onnx" ] || curl -fL -o "$ROOT/models/kokoro-v1.0.onnx" "$MODELS/kokoro-v1.0.onnx"
[ -f "$ROOT/models/voices-v1.0.bin" ] || curl -fL -o "$ROOT/models/voices-v1.0.bin" "$MODELS/voices-v1.0.bin"

[ -d "$ROOT/remotion/node_modules" ] || (cd "$ROOT/remotion" && npm install)

"$ROOT/tools/.venv/bin/python" -I "$ROOT/tools/tts.py" "$EPISODE"
"$ROOT/tools/.venv/bin/python" -I "$ROOT/tools/chiptune.py" "$ROOT/remotion/src/generated/$ID.json"
"$ROOT/tools/.venv/bin/python" -I "$ROOT/tools/mix.py" "$ROOT/remotion/src/generated/$ID.json"

mkdir -p "$ROOT/out"
# Remotion's built-in static server stalls the headless browser on this machine,
# so serve the bundle with Python and point Remotion at the URL instead.
BUNDLE="$(mktemp -d)"
PORT=8769
(cd "$ROOT/remotion" && ./node_modules/.bin/remotion bundle src/index.ts --out-dir="$BUNDLE")
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$BUNDLE" >/dev/null 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null; rm -rf "$BUNDLE"' EXIT
sleep 1
(cd "$ROOT/remotion" && ./node_modules/.bin/remotion render "http://127.0.0.1:$PORT" "$ID" "$ROOT/out/$ID.mp4" --codec=h264 --crf=18)
"$ROOT/tools/.venv/bin/python" -I "$ROOT/tools/qa.py" "$ROOT/out/$ID.mp4" "$ROOT/remotion/src/generated/$ID.json"
echo "done: out/$ID.mp4 (QA: out/$ID-qa.md, out/$ID-contact.png)"
