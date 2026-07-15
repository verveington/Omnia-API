FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.8.14 /uv /uvx /bin/
WORKDIR /workspace/adapter
COPY adapter/pyproject.toml adapter/uv.lock ./
RUN uv sync --frozen --no-dev

COPY adapter/omnia_adapter ./omnia_adapter
COPY openapi /workspace/openapi
COPY nocobase-omnia/e2e /workspace/nocobase-omnia/e2e

ENV PATH="/workspace/adapter/.venv/bin:$PATH"
CMD ["uvicorn", "omnia_adapter.app:app", "--host", "0.0.0.0", "--port", "8890", "--no-access-log"]
