# ---------- BUILDER stage ----------
FROM python:3.12-slim AS builder

#set env variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# install build dependencies (ONLY for builder)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# build wheels instead of installing directly
RUN pip install --upgrade pip && \
    pip wheel --no-cache-dir --no-deps -r requirements.txt -w /wheels


# ---------- FINAL stage ----------
FROM python:3.12-slim

#set env variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# install only runtime dependency
RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# install from prebuilt wheels
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/*

#copy rest of the project
COPY . .

# REMOVED: collectstatic from build stage - this accounted for 4GBs worth of build cache, stupid decision
# RUN python manage.py collectstatic --noinput || true

#expose Django's port
EXPOSE 8000

# start Django with Gunicorn
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]