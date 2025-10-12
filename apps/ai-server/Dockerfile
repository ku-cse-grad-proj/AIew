# 1. Builder Stage: Install dependencies
FROM python:3.11-slim AS builder

# Set working directory
WORKDIR /app

# Install poetry (no system dependencies needed in builder)
RUN pip install --no-cache-dir poetry

# Copy dependency definition files
COPY apps/ai-server/poetry.lock apps/ai-server/pyproject.toml ./

# Install dependencies, without dev dependencies, into a virtual environment
# This creates a virtual environment in /app/.venv
RUN poetry config virtualenvs.in-project true && \
    poetry install --no-root --only main

# 2. Runner Stage: Run the application
FROM python:3.11-slim AS runner

WORKDIR /app

# Install runtime dependencies for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set environment variables
ENV POETRY_NO_INTERACTION=1 \
    PYTHONUNBUFFERED=1 \
    # Point to the virtual environment created in the builder stage
    PATH="/app/.venv/bin:$PATH"

# The FastAPI app will run on port 8000
EXPOSE 8000

# Copy the virtual environment from the builder stage
COPY --from=builder /app/.venv ./.venv

# Copy the application source code
COPY apps/ai-server/app ./app

# Start the FastAPI server with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
