from fastapi import FastAPI

app = FastAPI()

@app.get("/s3-upload")
def presigned_s3_upload():
    