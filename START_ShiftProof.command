#!/bin/bash
cd "$(dirname "$0")"
echo "Starting ShiftProof ONE v6..."
if ! python3 -c 'import qrcode, PIL' >/dev/null 2>&1; then
  echo "Installing QR support (qrcode + Pillow)..."
  python3 -m pip install --user 'qrcode[pil]>=8.0' || {
    echo "Could not install QR support. ShiftProof will run, but QR image generation may be unavailable."
  }
fi
python3 server.py