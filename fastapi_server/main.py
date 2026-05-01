from fastapi import FastAPI
from fastapi_server.routes import files

app = FastAPI()

app.include_router(files.router)
