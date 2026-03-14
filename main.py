from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
import pyfiglet

app = FastAPI()

# Static files (CSS)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/generate-ascii", response_class=PlainTextResponse)
async def generate_ascii(request: Request):
    data = (await request.body()).decode()
    # Generiere ASCII-Art mit pyfiglet (Standardstil)
    ascii_art = pyfiglet.figlet_format(data)

    return ascii_art

@app.get("/")
def read_index():
    return FileResponse("static/index.html")
   
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=2000)
