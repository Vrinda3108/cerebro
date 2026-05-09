from fastapi import FastAPI

app = FastAPI(
  title="Cerebro API",
  version="1.0.0"
)

@app.get("/")
def root():
  return {
    "message" : "Cerebro backend running"
  }