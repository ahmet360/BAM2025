#!/usr/bin/env bash
set -e

# 1. Set up a Python virtual environment for the backend
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# 2. Install frontend dependencies
pushd frontend
npm install
popd

echo "Setup complete."
echo "Start backend: source .venv/bin/activate && uvicorn backend.app:app --reload"
echo "Start frontend: (cd frontend && npm run dev)"