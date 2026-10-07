#!/bin/zsh
# Double-click this file on macOS to start the local Game Lab.
cd -- "$(dirname -- "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed yet."
  echo "A parent, teacher, or other adult can install the LTS version from:"
  echo "https://nodejs.org/en/download"
  open "https://nodejs.org/en/download"
  echo "After installation, close this window and double-click this file again."
  read "?Press Return to close this window."
  exit 1
fi

export OPEN_GAME_LAB=1
node scripts/serve.mjs
echo "The Game Lab has stopped."
read "?Press Return to close this window."
