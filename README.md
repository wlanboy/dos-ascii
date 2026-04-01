# dos-ascii

ASCII-Art-Generator im MS-DOS-Stil. Text eingeben, ASCII-Art generieren – im Look eines echten DOS 6.22-Fensters mit CRT-Scanlines, klassischer Menüleiste und 80er-Farbpalette.

## Features

- ASCII-Art-Generierung via [pyfiglet](https://github.com/pwaller/pyfiglet)
- Vollbild-DOS-UI mit Titelleiste, Menüleiste und Statusleiste
- **Options** – Ausgabefarbe wählen (9 Farben der 80er)
- **View** – Schriftart wechseln (Courier New, VT323, Share Tech Mono, IBM Plex Mono)
- **Edit** – ASCII-Art als Text oder Markdown-Codeblock kopieren
- **File › New** – Seite zurücksetzen
- Tastenkürzel: `Enter` / `Shift+Enter` zum Generieren, `Ctrl+M` für Markdown-Copy

## Voraussetzungen

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (empfohlen) **oder** pip

## Installation & Start

### Mit uv

```bash
uv lock --upgrade
uv sync
uv run pyright
uv run main.py
```

### Mit pip

```bash
pip install fastapi uvicorn pyfiglet
python main.py
```

Die App läuft danach auf [http://localhost:2000](http://localhost:2000).

## Projektstruktur

```
dos-ascii/
├── main.py            # FastAPI-Server
├── pyproject.toml     # Abhängigkeiten
└── static/
    ├── index.html     # Markup
    ├── dos.css        # DOS-Styling & CRT-Effekt
    └── exe.js         # Menülogik, Farbwahl, Generierung
```

## API

| Method | Pfad              | Body         | Response           |
|--------|-------------------|--------------|--------------------|
| POST   | `/generate-ascii` | `text/plain` | ASCII-Art als Text |
