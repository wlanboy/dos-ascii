// ── State ─────────────────────────────────────────────
let currentColor = 'green';
let currentFont  = 'courier';

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
};

const FONTS = {
    courier:   "'Courier New', monospace",
    vt323:     "'VT323', monospace",
    sharetech: "'Share Tech Mono', monospace",
    ibmplex:   "'IBM Plex Mono', monospace",
};

// ── Menu Toggle ───────────────────────────────────────
function toggleMenu(e, dropdownId) {
    e.stopPropagation();
    const target = document.getElementById(dropdownId);
    const isOpen = target.classList.contains('open');

    // close all
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

// ── View: Font ────────────────────────────────────────
function setFont(key) {
    currentFont = key;
    document.getElementById('content').style.fontFamily = FONTS[key];

    Object.keys(FONTS).forEach(k => {
        const el = document.getElementById('check-font-' + k);
        if (el) el.textContent = k === key ? '✓' : ' ';
    });
}

// ── Options: Color ────────────────────────────────────
function setColor(key) {
    currentColor = key;
    document.getElementById('output').style.color = COLORS[key];

    Object.keys(COLORS).forEach(k => {
        const el = document.getElementById('check-color-' + k);
        if (el) el.textContent = k === key ? '✓' : ' ';
    });
}

// ── Status bar helper ────────────────────────────────
function setStatus(msg) {
    const el = document.querySelector('.status-item');
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

    fetch('/generate-ascii', {
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
