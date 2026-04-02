figlet.defaults({ fontPath: 'figlet/fonts' });

// ── State ─────────────────────────────────────────────
let currentColor      = 'green';
let currentFont       = 'courier';
let currentMode       = 'dos';
let currentFigletFont = 'Standard';
let currentEffect     = 'none';
let currentBorder     = 'none';
let glowEnabled       = false;
let scrollerEnabled   = false;

const COLORS = {
    green:    '#0f0',
    amber:    '#ffb000',
    cyan:     '#0ff',
    white:    '#fff',
    yellow:   '#ff0',
    orange:   '#ff6600',
    magenta:  '#f0f',
    pink:     '#ff69b4',
    blue:     '#00bfff',
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
    'Standard', 'Banner', 'Banner3', 'Big', 'Block', 'Colossal', 'Digital', 'Chunky', 'Broadway',
    // Demoscene
    'Doom', 'Speed', 'Slant', 'Lean', 'Graffiti', 'Epic', 'Doh', 'ANSI Shadow', 'Bloody', 'Poison',
    // Retro / C64
    'Ogre', 'Roman', 'Script', 'Cosmike', 'Star Wars', 'Gothic', 'Ghost',
    // 3D
    '3-D', '3D-ASCII', 'Henry 3D', 'Larry 3D', 'Larry 3D 2',
    'Isometric1', 'Isometric2', 'Isometric3', 'Isometric4',
];

const EFFECTS = ['none', 'shadow', 'mirror', 'flip'];
const BORDERS = ['none', 'single', 'double', 'block'];

// ── Effects (ported from Python backend) ─────────────
function applyShadow(art) {
    const lines = art.replace(/\n+$/, '').split('\n');
    const maxLen = Math.max(...lines.map(l => l.length)) + 2;
    const padded = lines.map(l => l.padEnd(maxLen));
    const shadow = padded.map(l => ' ' + [...l].map(c => c !== ' ' ? '░' : ' ').join(''));
    const merged = [];
    for (let i = 0; i <= padded.length; i++) {
        if (i === 0) {
            merged.push(padded[0]);
        } else if (i === padded.length) {
            merged.push(shadow[i - 1]);
        } else {
            const orig = padded[i].padEnd(maxLen + 1);
            const shad = shadow[i - 1].padEnd(maxLen + 1);
            let line = '';
            for (let j = 0; j < orig.length; j++) {
                line += orig[j] !== ' ' ? orig[j] : shad[j];
            }
            merged.push(line.replace(/\s+$/, ''));
        }
    }
    return merged.join('\n');
}

function applyMirror(art) {
    return art.replace(/\n+$/, '').split('\n').map(l => [...l].reverse().join('')).join('\n');
}

function applyFlip(art) {
    return art.replace(/\n+$/, '').split('\n').reverse().join('\n');
}

function applyBorder(art, style) {
    const lines = art.replace(/\n+$/, '').split('\n');
    const maxLen = Math.max(...lines.map(l => l.length));
    let top, bot, row;
    if (style === 'single') {
        top = '┌' + '─'.repeat(maxLen + 2) + '┐';
        bot = '└' + '─'.repeat(maxLen + 2) + '┘';
        row = l => '│ ' + l.padEnd(maxLen) + ' │';
    } else if (style === 'double') {
        top = '╔' + '═'.repeat(maxLen + 2) + '╗';
        bot = '╚' + '═'.repeat(maxLen + 2) + '╝';
        row = l => '║ ' + l.padEnd(maxLen) + ' ║';
    } else if (style === 'block') {
        top = '█' + '▀'.repeat(maxLen + 2) + '█';
        bot = '█' + '▄'.repeat(maxLen + 2) + '█';
        row = l => '█ ' + l.padEnd(maxLen) + ' █';
    } else {
        return art;
    }
    return [top, ...lines.map(row), bot].join('\n');
}

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
    setColor(m.color);
    setStatus(currentMode === 'dos' ? 'DOS MODE' : 'C64 MODE');
}

// ── File ──────────────────────────────────────────────
function newFile() { location.reload(); }

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

// ── Effects ───────────────────────────────────────────
function setEffect(key) {
    currentEffect = key;
    EFFECTS.forEach(e => {
        const el = document.getElementById('check-effect-' + e);
        if (el) el.textContent = e === key ? '✓' : ' ';
    });
    setStatus('EFFECT: ' + key.toUpperCase());
}

function setBorder(key) {
    currentBorder = key;
    BORDERS.forEach(b => {
        const el = document.getElementById('check-border-' + b);
        if (el) el.textContent = b === key ? '✓' : ' ';
    });
    setStatus('BORDER: ' + key.toUpperCase());
}

function toggleGlow() {
    glowEnabled = !glowEnabled;
    document.getElementById('output').classList.toggle('glow-mode', glowEnabled);
    document.getElementById('check-glow').textContent = glowEnabled ? '✓' : ' ';
    setStatus(glowEnabled ? 'GLOW: ON' : 'GLOW: OFF');
}

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

// ── Status bar ────────────────────────────────────────
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

// ── Generate (client-side via figlet.js) ─────────────
function generateASCII() {
    const inputText = document.getElementById('input-text').value;
    if (!inputText) return;

    document.getElementById('cmd-echo').textContent = 'ascii.exe "' + inputText + '"';
    document.getElementById('output').textContent = 'Generating...';
    document.getElementById('gen-btn').textContent = '[ WORKING... ]';

    figlet.text(inputText, { font: currentFigletFont }, function (err, art) {
        if (err || !art) {
            figlet.text(inputText, { font: 'Standard' }, function (err2, art2) {
                render(err2 ? inputText : art2);
            });
            return;
        }
        render(art);
    });
}

function render(art) {
    if (currentEffect === 'shadow') art = applyShadow(art);
    else if (currentEffect === 'mirror') art = applyMirror(art);
    else if (currentEffect === 'flip') art = applyFlip(art);

    if (currentBorder !== 'none') art = applyBorder(art, currentBorder);

    const output = document.getElementById('output');
    output.textContent = art;
    output.style.color = COLORS[currentColor];
    document.getElementById('gen-btn').textContent = '[ GENERATE ]';
    document.getElementById('status-chars').textContent =
        'CHARS: ' + document.getElementById('input-text').value.length;
}
