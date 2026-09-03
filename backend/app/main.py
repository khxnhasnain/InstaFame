import sys
import socket
from pathlib import Path

socket.setdefaulttimeout(3.0)


backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import instagram
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="InstaFame API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(instagram.router)

@app.get("/")
async def root():
    return {"message": "InstaFame API running", "status": "active"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
