# Changes from upstream

This is the Asciiverse terminal edition of Goldfish, Ondřej Žára's game for
the 2014 Seven Day Roguelike Challenge, from github.com/ondras/goldfish (the
`upstream` remote; this branch, `asciiverse`, starts from its master at
`e7b397c`, 2020-07-16, with the full history). It is here by the author's
permission (`PERMISSION.md`).

**The game's own files are unchanged.** Everything new is in `asciiverse/`,
so upstream changes merge as they are; README.md gets a note at the top on
playing it with av.

## How it works

Goldfish draws everything through one rot.js display: a 100x36 grid of
characters (three rows of messages, the 100x30 lake, three rows of status).
rot.js paints that grid onto a canvas; here the canvas is the terminal.

- `asciiverse/rotty/` (rotty, written for Ondřej's rot.js games, so the
  next ones are mostly packaging):
  - `dom.js`: the browser as far as these games use it: `window` as the
    global object, a small element tree with `innerHTML`, selectors and
    events, `localStorage` in a file, `XMLHttpRequest` for the game's own
    files, timers and `requestAnimationFrame`. A canvas is a grid of cells.
  - `main.js`: after the game's scripts are loaded, rot.js's rectangular
    display backend is pointed at the canvas's cells (one cell per
    character, sizes counted in cells); the page's load event; the frame
    loop; the terminal set up and put back; saving.
  - `term.js`: truecolor cells, written only where they changed; keys from
    the terminal turned into the browser's `keydown`, `keypress` and
    `keyup` with the keyCodes rot.js games test (`ROT.VK_*`).
  - `prelude.js`: QuickJS's modules, timers and a console that writes to
    the log, never over the screen.
- `asciiverse/game.js`: Goldfish's layout. The title page is index.html's
  own text, centred, with its blinking line and the waves' colours. At
  100x36 or larger the display is shown whole; smaller, the messages stay
  at the top, the status at the bottom, and the lake scrolls with the fish
  (over help, the inventory or the quests it shows that page instead).
- `asciiverse/build.py`: index.html's scripts, in its order, become one
  classic script, run unchanged (sloppy mode, its own globals, its own
  `Promise`); the page's `<body>` and `fish.txt` come along as strings.
- `asciiverse/Makefile`: QuickJS-ng's `qjsc` compiles it all into a C
  program, one native binary of about 2 MB that needs nothing to run.

## Ours

- **Keys:** arrows, the numpad, vim keys as in the browser; the digits
  1 to 9 also walk, like the numpad (the inventory's number picks still get
  their keypress). Ctrl+C or Ctrl+Q quits.
- **A new game after dying:** the game asks to reload the page; here R
  starts a new game (the program starts itself again), Ctrl+Q quits.
- **Session log:** `goldfish.log` in the state folder
  (`$XDG_STATE_HOME/goldfish`, `~/.local/state/goldfish`, Application
  Support on macOS, `%LOCALAPPDATA%` on Windows). `GOLDFISH_LOG=debug`
  (or `ROTTY_LOG=debug`) records every key and a snapshot each second
  (screen size, the fish's position, which page has the keys).

## Imported

- `asciiverse/quickjs/`: QuickJS-ng 0.17.0 as in our Candy Box 2 (one
  change in `quickjs-libc.c`: a signal interrupting `poll()` no longer ends
  the event loop), MIT.
- `asciiverse/ROT-LICENSE`: rot.js's licence (BSD-3-Clause), for the
  `js/rot.min.js` the game bundles.

## Packaging

- `.github/workflows/release.yml`: static Linux (musl, x86-64 and ARM64),
  macOS (x86-64 and ARM64) and Windows (x86-64, MinGW) archives plus
  SHA256SUMS, on tags `*-av.*`.
- `asciiverse/package.sh`: the archive (the program, PERMISSION.md,
  PATCHES.md, the licences).
- `asciiverse/record-preview.sh`: the 100x30 catalog preview, with hub's
  castrec.py.
