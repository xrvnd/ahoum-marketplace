FROM python:3.12-slim

#set env variables
ENV PYTHONDONTWRITEBYTECODE=1

# Prevents Python from buffering stdout/stderr (see logs in real time)
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


COPY requirements.txt .

RUN pip install --upgrade pip && pip install -r requirements.txt

#copy rest of the project
COPY . .

#collecting static files for nginx to work
RUN python manage.py collectstatic --noinput || true

#expose Django's port
EXPOSE 8000

# start Django with Gunicorn
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]



