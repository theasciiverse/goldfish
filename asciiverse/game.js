// Goldfish in the terminal: how the page is laid out on the screen.
/* BUILD {"files": ["fish.txt"], "inline": []} */

var GAME = {
    id: "goldfish",
    digitsAsNumpad: true,   // 1 to 9 walk like the numpad (inventory picks still get their keypress)
    view: { x: 0, y: 0 },
    usage: "goldfish [--version]\n\n" +
        "Goldfish by Ondrej Zara (7DRL 2014), in the terminal.\n" +
        "Move with the arrows, the numpad, 1 to 9 or vim keys (hjklyubn); Enter\n" +
        "enters tunnels and picks items up; i inventory, q quests, ? help.\n" +
        "Ctrl+C or Ctrl+Q quits. Best at 100x36 or larger; smaller windows scroll\n" +
        "the map with the fish. GOLDFISH_LOG=debug logs every key to the state folder.\n"
};

// the title page: index.html's <pre> blocks, centred as the page's CSS does
GAME.introColors = { center: "#aaa", gold: "rgb(255,220,120)", wave: null, blink: "#aaa" };
GAME.intro = function () {
    var blocks = DOM.query(document.body, "pre", false).map(function (pre) {
        var lines = pre.textContent.replace(/^\n/, "").split("\n");
        while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
        return { cls: pre.className, lines: lines.map(function (l) { return l.replace(/\t/g, "    "); }) };
    });
    var total = 0;
    blocks.forEach(function (b, i) { total += b.lines.length + (i ? 1 : 0); });
    var y = Math.max(0, ((TERM.h - total) / 2) | 0), t = Date.now() / 1000;
    blocks.forEach(function (b, i) {
        if (i) y++;
        var fg = GAME.introColors[b.cls] || "#aaa";
        if (b.cls == "wave") {   // 5 s from dark to bright blue and back
            var p = (t % 10) / 5; if (p > 1) p = 2 - p;
            fg = p < 0.5 ? TERM.mix([0, 0, 50], [30, 30, 150], p * 2) : TERM.mix([30, 30, 150], [50, 50, 250], (p - 0.5) * 2);
        }
        if (b.cls == "blink") {   // shown, then fading out, every second
            var q = (t % 2) / 2; var o = q < 0.5 ? 1 : q < 0.75 ? 1 : 1 - (q - 0.75) * 4;
            fg = TERM.mix([0, 0, 0], [170, 170, 170], Math.max(0, Math.min(1, o)));
        }
        var w = 0;
        b.lines.forEach(function (l) { w = Math.max(w, l.length); });
        b.lines.forEach(function (l) {
            var x = ((TERM.w - l.length) / 2) | 0;
            TERM.text(x, y++, l, fg, null);
        });
    });
};

// Which handler has the keys: the player walking, or a page over the map
GAME.topHandler = function () {
    var list = window._listeners.keydown || [];
    return list[list.length - 1];
};
GAME.following = function () {
    var h = GAME.topHandler();
    if (typeof Help != "undefined" && h instanceof Help) return false;
    if (typeof Inventory != "undefined" && h instanceof Inventory) return false;
    if (typeof Quests != "undefined" && h instanceof Quests) return false;
    if (typeof InventorySlot != "undefined" && h instanceof InventorySlot) return false;
    return !!(Game.player && Game.player.getXY() && Game.level);
};

// The display is 100x36: three rows of messages, the 100x30 sea, three rows
// of status. When the terminal is smaller the messages stay at the top, the
// status at the bottom, and the sea scrolls with the fish (or, over a page
// such as help or the inventory, shows that page)
GAME.layout = function () {
    var c = Game.display ? Game.display.getContainer() : null;
    if (!c || !c.parentNode) { GAME.intro(); return; }
    var top = Game.TEXT_HEIGHT, bottom = Game.STATUS_HEIGHT, mid = c.rows - top - bottom;
    var W = TERM.w, H = TERM.h;
    if (W >= c.cols && H >= c.rows) {
        TERM.blit(c, ((W - c.cols) / 2) | 0, ((H - c.rows) / 2) | 0);
        return;
    }
    var vw = Math.min(W, c.cols), vh = Math.max(1, Math.min(H - top - bottom, mid));
    var ox = Math.max(0, ((W - c.cols) / 2) | 0);
    var follow = GAME.following(), v = GAME.view;
    if (follow) {
        var p = Game.player.getXY();
        v.x = Math.max(0, Math.min(c.cols - vw, p.x - (vw >> 1)));
        v.y = Math.max(0, Math.min(mid - vh, p.y - (vh >> 1)));
    } else {
        // the page's own cells, kept in view
        var minx = c.cols, maxx = -1, miny = mid, maxy = -1;
        for (var y = 0; y < mid; y++) for (var x = 0; x < c.cols; x++) {
            if (c.ch[(y + top) * c.cols + x] != " ") { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
        }
        if (maxy >= 0) {
            v.y = maxy - miny + 1 <= vh ? Math.max(0, Math.min(mid - vh, miny - (((vh - (maxy - miny + 1)) / 2) | 0))) : miny;
            v.x = maxx - minx + 1 <= vw ? Math.max(0, Math.min(c.cols - vw, minx - (((vw - (maxx - minx + 1)) / 2) | 0))) : minx;
        }
    }
    var sx = W >= c.cols ? 0 : v.x;
    TERM.blit(c, ox, 0, sx, 0, vw, top);
    TERM.blit(c, ox, top, sx, top + v.y, vw, vh);
    TERM.blit(c, ox, top + vh, sx, top + mid, vw, bottom);
};

GAME.snapshot = function () {
    var p = typeof Game != "undefined" && Game.player && Game.player.getXY && Game.player.getXY();
    var h = GAME.topHandler();
    return "player=" + (p ? p.x + "," + p.y : "-") + " handler=" + (h && h.constructor && h.constructor.name || typeof h) +
        " level=" + (Game.level && Game.level.constructor && Game.level.constructor.name || "-");
};

// When the fish dies the game asks to reload the page; here R starts a new
// game (the program starts itself again) and Ctrl+Q quits
GAME.dead = false;
GAME.ready = function () {
    var over = Game.over;
    Game.over = function () {
        over.apply(this, arguments);
        GAME.dead = true;
        Game.text.write("%c{#fff}R%c{} starts a new game, %c{#fff}Ctrl+Q%c{} quits.");
        Game.text.flush();
    };
};
GAME.onKey = function (e) {
    if (GAME.dead && (e.key == "r" || e.key == "R")) { MAIN.reload(); return false; }
};
