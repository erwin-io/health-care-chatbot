#!/usr/bin/env bash
# Force python 3.11 and pip installation on Render

echo "Setting up Python 3.11 virtual environment manually..."
pyenv install -s 3.11.8
pyenv global 3.11.8
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
