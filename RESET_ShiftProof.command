#!/bin/bash
cd "$(dirname "$0")"
echo "This resets the local ShiftProof ONE v4 demo database."
read -r -p "Type RESET to continue: " answer
if [ "$answer" != "RESET" ]; then
  echo "Cancelled."
  exit 0
fi
rm -f shiftproof_v4.db shiftproof_v4.db-shm shiftproof_v4.db-wal
find uploads -type f ! -name '.keep' -delete 2>/dev/null || true
echo "Reset complete. Start ShiftProof again to recreate the demo plant."
