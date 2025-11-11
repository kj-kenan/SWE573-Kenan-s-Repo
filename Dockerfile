FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/app
ENV DJANGO_SETTINGS_MODULE=mysite.settings

WORKDIR /app/backend

CMD ["bash", "-lc", "python manage.py collectstatic --noinput && python manage.py migrate && gunicorn mysite.wsgi:application --bind 0.0.0.0:8000 --workers 3"]
