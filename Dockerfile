FROM python:3.10-slim

# Install system deps
RUN apt-get update && apt-get install -y build-essential

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
