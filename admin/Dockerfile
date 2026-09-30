FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY server ./server
COPY frontend ./frontend

RUN useradd --system --uid 10001 --create-home admin
USER admin

EXPOSE 8000
CMD ["uvicorn", "main:app", "--app-dir", "/app/server", "--host", "0.0.0.0", "--port", "8000"]
