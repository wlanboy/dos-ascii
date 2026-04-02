// ── State ─────────────────────────────────────────────
let currentColor      = 'green';
let currentFont       = 'courier';
let currentMode       = 'dos';
let currentFigletFont = 'standard';
let currentEffect     = 'none';
let currentBorder     = 'none';
let glowEnabled       = false;
let scrollerEnabled   = false;

const COLORS = {
    // DOS / ANSI
    green:    '#0f0',
    amber:    '#ffb000',
    cyan:     '#0ff',
    white:    '#fff',
    yellow:   '#ff0',
    orange:   '#ff6600',
    magenta:  '#f0f',
    pink:     '#ff69b4',
    blue:     '#00bfff',
    // C64 palette (VICE)
    c64_white:      '#ffffff',
    c64_cyan:       '#70a4b2',
    c64_green:      '#588d43',
    c64_blue:       '#352879',
    c64_yellow:     '#b8c76f',
    c64_purple:     '#6f3d86',
    c64_red:        '#68372b',
    c64_orange:     '#6f4f25',
    c64_brown:      '#433900',
    c64_lightred:   '#9a6759',
    c64_darkgrey:   '#444444',
    c64_grey:       '#6c6c6c',
    c64_lightgreen: '#9ad284',
    c64_lightblue:  '#6c5eb5',
    c64_lightgrey:  '#959595',
};

const FONTS = {
    courier:   "'Courier New', monospace",
    vt323:     "'VT323', monospace",
    sharetech: "'Share Tech Mono', monospace",
    ibmplex:   "'IBM Plex Mono', monospace",
};

const FIGLET_FONTS = [
    // Classic DOS
    'standard', 'banner', 'banner3', 'big', 'block', 'colossal', 'digital', 'chunky', 'broadway',
    // Demoscene
    'doom', 'speed', 'slant', 'lean', 'graffiti', 'epic', 'doh', 'bloody', 'poison',
    // Retro / C64
    'ogre', 'roman', 'script', 'cosmic', 'starwars', 'gothic', 'ghost',
    // 3D
    '3-d', '3d-ascii', 'larry3d', 'isometric1', 'isometric2', 'isometric3', 'isometric4',
];

const EFFECTS = ['none', 'shadow', 'mirror', 'flip'];
const BORDERS = ['none', 'single', 'double', 'block'];

// ── Menu Toggle ───────────────────────────────────────
function toggleMenu(e, dropdownId) {
    e.stopPropagation();
    const target = document.getElementById(dropdownId);
    const isOpen = target.classList.contains('open');

    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

    if (!isOpen) {
        target.classList.add('open');
        e.currentTarget.classList.add('active');
    }
}

document.addEventListener('click', function () {
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
});

// ── Mode Toggle ───────────────────────────────────────
const MODE_CONTENT = {
    dos: {
        title:   'ASCII Art Generator - [C:\\ASCII.EXE]',
        boot:    'Microsoft(R) MS-DOS(R) Version 6.22<br><span>(C)Copyright Microsoft Corp 1981-1994.</span>',
        cmd:     'C:\\ASCII&gt; <span id="cmd-echo"></span>',
        label:   'C:\\ASCII&gt; OUTPUT:',
        scroller:'*** DOS ASCII ART GENERATOR v2.0 *** WELCOME TO THE DEMOSCENE *** USE THE STYLE MENU TO PICK YOUR FONT *** EFFECTS: SHADOW, MIRROR, FLIP *** BORDERS: SINGLE, DOUBLE, BLOCK *** GREETINGS TO ALL ASCII ARTISTS ***\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0',
        btnText: '[ C64 ]',
        color:   'green',
    },
    c64: {
        title:   'ASCII Art Generator - [ASCII.PRG]',
        boot:    '    **** COMMODORE 64 BASIC V2 ****<br><span> 64K RAM SYSTEM  38911 BASIC BYTES FREE</span>',
        cmd:     'READY.<br><span id="cmd-echo"></span>',
        label:   'READY. OUTPUT:',
        scroller:'*** COMMODORE 64 ASCII ART *** RASTER BARS ARE ALIVE *** WELCOME TO THE SCENE *** GREETINGS TO ALL C64 CODERS WORLDWIDE *** SYS 64738 ***\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0',
        btnText: '[ DOS ]',
        color:   'c64_lightgreen',
    },
};

function toggleMode() {
    currentMode = currentMode === 'dos' ? 'c64' : 'dos';
    const m = MODE_CONTENT[currentMode];

    document.getElementById('theme-dos').disabled = currentMode !== 'dos';
    document.getElementById('theme-c64').disabled = currentMode !== 'c64';

    document.getElementById('title-text').textContent = m.title;
    document.getElementById('boot-line').innerHTML    = m.boot;
    document.getElementById('cmd-line').innerHTML     = m.cmd;
    document.getElementById('output-label').textContent = m.label;
    document.getElementById('scroller-text').innerHTML = m.scroller;
    document.getElementById('mode-btn').textContent   = m.btnText;

    setColor(m.color);
    setStatus(currentMode === 'dos' ? 'DOS MODE' : 'C64 MODE');
}

// ── File ──────────────────────────────────────────────
function newFile() {
    location.reload();
}

// ── Edit ──────────────────────────────────────────────
function copyAscii() {
    const text = document.getElementById('output').textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => setStatus('COPIED'));
}

function copyMarkdown() {
    const text = document.getElementById('output').textContent;
    if (!text) return;
    navigator.clipboard.writeText('```\n' + text + '\n```').then(() => setStatus('COPIED AS MARKDOWN'));
}

// ── View: Display Font ────────────────────────────────
function setFont(key) {
    currentFont = key;
    document.getElementById('content').style.fontFamily = FONTS[key];
    Object.keys(FONTS).forEach(k => {
        const el = document.getElementById('check-font-' + k);
        if (el) el.textContent = k === key ? '✓' : ' ';
    });
}

// ── Style: Figlet Font ────────────────────────────────
function setFigletFont(key) {
    currentFigletFont = key;
    FIGLET_FONTS.forEach(f => {
        const el = document.getElementById('check-figlet-' + f);
        if (el) el.textContent = f === key ? '✓' : ' ';
    });
    setStatus('STYLE: ' + key.toUpperCase());
}

// ── Effects: Text Effect ──────────────────────────────
function setEffect(key) {
    currentEffect = key;
    EFFECTS.forEach(e => {
        const el = document.getElementById('check-effect-' + e);
        if (el) el.textContent = e === key ? '✓' : ' ';
    });
    setStatus('EFFECT: ' + key.toUpperCase());
}

// ── Effects: Border ───────────────────────────────────
function setBorder(key) {
    currentBorder = key;
    BORDERS.forEach(b => {
        const el = document.getElementById('check-border-' + b);
        if (el) el.textContent = b === key ? '✓' : ' ';
    });
    setStatus('BORDER: ' + key.toUpperCase());
}

// ── Effects: Neon Glow ────────────────────────────────
function toggleGlow() {
    glowEnabled = !glowEnabled;
    document.getElementById('output').classList.toggle('glow-mode', glowEnabled);
    document.getElementById('check-glow').textContent = glowEnabled ? '✓' : ' ';
    setStatus(glowEnabled ? 'GLOW: ON' : 'GLOW: OFF');
}

// ── Effects: Demo Scroller ────────────────────────────
function toggleScroller() {
    scrollerEnabled = !scrollerEnabled;
    document.getElementById('scroller-bar').style.display = scrollerEnabled ? 'flex' : 'none';
    document.getElementById('check-scroller').textContent = scrollerEnabled ? '✓' : ' ';
    setStatus(scrollerEnabled ? 'SCROLLER: ON' : 'SCROLLER: OFF');
}

// ── Colors ────────────────────────────────────────────
function setColor(key) {
    currentColor = key;
    document.getElementById('output').style.color = COLORS[key];
    Object.keys(COLORS).forEach(k => {
        const el = document.getElementById('check-color-' + k);
        if (el) el.textContent = k === key ? '✓' : ' ';
    });
}

// ── Status bar helper ─────────────────────────────────
function setStatus(msg) {
    const el = document.getElementById('status-msg');
    el.textContent = msg;
    setTimeout(() => el.textContent = 'READY', 2000);
}

// ── Clock ─────────────────────────────────────────────
function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = h + ':' + m + ':' + s;
}
updateClock();
setInterval(updateClock, 1000);

// ── Char counter ──────────────────────────────────────
document.getElementById('input-text').addEventListener('input', function () {
    document.getElementById('status-chars').textContent = 'CHARS: ' + this.value.length;
});

// ── Keyboard shortcuts ────────────────────────────────
document.getElementById('input-text').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') generateASCII();
});
document.addEventListener('keydown', function (e) {
    if (e.shiftKey && e.key === 'Enter') generateASCII();
    if (e.ctrlKey && e.key === 'n') { e.preventDefault(); newFile(); }
    if (e.ctrlKey && e.key === 'm') { e.preventDefault(); copyMarkdown(); }
});

// ── Generate ──────────────────────────────────────────
function generateASCII() {
    const inputText = document.getElementById('input-text').value;
    if (!inputText) return;

    document.getElementById('cmd-echo').textContent = 'ascii.exe "' + inputText + '"';
    document.getElementById('output').textContent = 'Generating...';
    document.getElementById('gen-btn').textContent = '[ WORKING... ]';

    const params = new URLSearchParams({
        font:   currentFigletFont,
        effect: currentEffect,
        border: currentBorder,
    });

    fetch('/generate-ascii?' + params.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: inputText,
    })
    .then(r => r.text())
    .then(data => {
        document.getElementById('output').textContent = data;
        document.getElementById('output').style.color = COLORS[currentColor];
        document.getElementById('gen-btn').textContent = '[ GENERATE ]';
        document.getElementById('status-chars').textContent = 'CHARS: ' + inputText.length;
    })
    .catch(() => {
        document.getElementById('output').textContent = 'ERROR: Could not connect to server.';
        document.getElementById('gen-btn').textContent = '[ GENERATE ]';
    });
}
