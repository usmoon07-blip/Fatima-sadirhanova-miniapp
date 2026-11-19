#!/bin/bash
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js topilmadi: https://nodejs.org"; read; exit 1; }
node scripts/launch.js
