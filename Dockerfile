FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (including Pillow requirements)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libopenjp2-7-dev \
    libtiff5-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    python -c "import PIL; print(f'Pillow {PIL.__version__} installed successfully')" || \
    (echo "ERROR: Pillow installation failed!" && exit 1)

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV DJANGO_SETTINGS_MODULE=mysite.settings
ENV PYTHONUNBUFFERED=1

WORKDIR /app/backend

# Make entrypoint script executable
RUN chmod +x /app/backend/entrypoint.sh || true

# Expose port
EXPOSE 8000

# Use entrypoint script (bash to handle shebang)
ENTRYPOINT ["bash", "/app/backend/entrypoint.sh"]
CMD ["gunicorn", "mysite.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
