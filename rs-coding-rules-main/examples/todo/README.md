# Simple ToDo

## Setup

```bash
# env
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# config
cp .env.example .env
vi .env

# db
touch db.sqlite

# migration
alembic init migrations
vi migrations/env.py
alembic revision --autogenerate -m "init"
alembic upgrade head
```

## Run

```bash
python -m app.main
```
