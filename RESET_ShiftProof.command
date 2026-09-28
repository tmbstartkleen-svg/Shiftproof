#!/bin/bash
cd "$(dirname "$0")"
echo "This resets the local ShiftProof ONE v6 demo database."
read -r -p "Type RESET to continue: " answer
if [ "$answer" != "RESET" ]; then
  echo "Cancelled."
  exit 0
fi
rm -f shiftproof_v6.db shiftproof_v6.db-shm shiftproof_v6.db-wal
find uploads -type f ! -name '.keep' -delete 2>/dev/null || true
echo "Reset complete. Start ShiftProof again to recreate the v6 demo plant."