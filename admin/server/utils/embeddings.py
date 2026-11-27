import os
from sys import flags
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
import httpx

load_dotenv()

EMBEDDING_ENDPOINT="https://qwen-embedding-4b.tail877c9f.ts.net/v1/embeddings"
def embed_query(query: str) -> list[float]:
    payload = {"model": "Qwen/Qwen3-4B", "input": query}
    with httpx.AsyncClient() as client:
        response = client.post(EMBEDDING_ENDPOINT, json=payload)
        response.raise_for_status() 
        return response.json()["data"][0]["embedding"]
        