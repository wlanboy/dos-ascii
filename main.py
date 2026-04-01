from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, PlainTextResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import pyfiglet

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

FIGLET_FONTS = [
    "standard", "banner", "banner3", "big", "block",
    "doom", "speed", "slant", "lean", "graffiti", "epic", "doh",
    "ogre", "roman", "script", "cosmic", "starwars",
    "isometric1", "larry3d", "3-d",
]


def apply_shadow(art: str) -> str:
    lines = art.rstrip('\n').split('\n')
    max_len = max((len(l) for l in lines), default=0) + 2
    padded = [l.ljust(max_len) for l in lines]
    shadow = [' ' + ''.join('░' if c != ' ' else ' ' for c in l) for l in padded]
    merged = []
    for i in range(len(padded) + 1):
        if i == 0:
            merged.append(padded[0])
        elif i == len(padded):
            merged.append(shadow[i - 1])
        else:
            orig = padded[i].ljust(max_len + 1)
            shad = shadow[i - 1].ljust(max_len + 1)
            line = ''.join(o if o != ' ' else s for o, s in zip(orig, shad))
            merged.append(line.rstrip())
    return '\n'.join(merged)


def apply_mirror(art: str) -> str:
    return '\n'.join(line[::-1] for line in art.rstrip('\n').split('\n'))


def apply_flip(art: str) -> str:
    return '\n'.join(reversed(art.rstrip('\n').split('\n')))


def apply_border(art: str, style: str) -> str:
    lines = art.rstrip('\n').split('\n')
    max_len = max((len(l) for l in lines), default=0)
    if style == 'single':
        top = '┌' + '─' * (max_len + 2) + '┐'
        bot = '└' + '─' * (max_len + 2) + '┘'
        row = lambda l: '│ ' + l.ljust(max_len) + ' │'
    elif style == 'double':
        top = '╔' + '═' * (max_len + 2) + '╗'
        bot = '╚' + '═' * (max_len + 2) + '╝'
        row = lambda l: '║ ' + l.ljust(max_len) + ' ║'
    elif style == 'block':
        top = '█' + '▀' * (max_len + 2) + '█'
        bot = '█' + '▄' * (max_len + 2) + '█'
        row = lambda l: '█ ' + l.ljust(max_len) + ' █'
    else:
        return art
    return '\n'.join([top] + [row(l) for l in lines] + [bot])


@app.post("/generate-ascii", response_class=PlainTextResponse)
async def generate_ascii(request: Request):
    data = (await request.body()).decode()
    font   = request.query_params.get("font",   "standard")
    effect = request.query_params.get("effect", "none")
    border = request.query_params.get("border", "none")

    try:
        art = pyfiglet.figlet_format(data, font=font)
    except pyfiglet.FontNotFound:
        art = pyfiglet.figlet_format(data)

    if effect == "shadow":
        art = apply_shadow(art)
    elif effect == "mirror":
        art = apply_mirror(art)
    elif effect == "flip":
        art = apply_flip(art)

    if border != "none":
        art = apply_border(art, border)

    return art


@app.get("/fonts")
def list_fonts():
    return JSONResponse(FIGLET_FONTS)


@app.get("/")
def read_index():
    return FileResponse("static/index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=2000)
