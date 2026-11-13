#!/bin/sh
# Records the catalog preview, asciiverse/goldfish.cast, at 100x30 with
# hub's castrec.py: the title page, the help page, then a swim around the
# lake, the inventory and the quests. Run from the repo root after building.
set -eu
CASTREC=${CASTREC:-../../hub/tools/castrec.py}
state=$(mktemp -d)
trap 'rm -rf "$state"' EXIT
S="w3.5;kx;w4;kx;w2"
S="$S;r6:left:0.35;r4:up:0.35;r8:left:0.3;w1;r5:down:0.35;r10:right:0.3"
S="$S;w1;ki;w4;kesc;w1;kq;w4;kesc;w1"
S="$S;r8:right:0.3;r6:up:0.35;r6:right:0.3;r4:down:0.35;w1;k?;w4;kesc;w1"
S="$S;r10:left:0.3;r6:down:0.35;r8:left:0.3;w2"
XDG_STATE_HOME="$state" python3 "$CASTREC" "${1:-asciiverse/goldfish.cast}" . "$S" -- ./out/goldfish
