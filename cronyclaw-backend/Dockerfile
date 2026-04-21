FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_LINK_MODE=copy

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates git ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

COPY pyproject.toml uv.lock ./
RUN uv sync

COPY run_server.py ./
COPY conf.yaml ./
COPY mcp_servers.json ./
COPY src ./src
COPY backgrounds ./backgrounds
COPY upgrade_codes ./upgrade_codes
COPY characters ./characters
COPY prompts ./prompts
COPY frontend ./frontend
COPY live2d-models ./live2d-models

RUN sed -i "s/host: 'localhost'/host: '0.0.0.0'/" conf.yaml

EXPOSE 12393

CMD ["uv", "run", "run_server.py"]
