FROM python:3.12-slim

WORKDIR /app/scripts

RUN pip install --no-cache-dir yfinance pandas

COPY scripts/ /app/scripts/

CMD ["python"]