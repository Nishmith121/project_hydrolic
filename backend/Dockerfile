# Start with a clean, lightweight Python computer
FROM python:3.10-slim

# Create a folder inside this new computer called /app
WORKDIR /app

# Copy the requirements file and install the libraries
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all your python scripts and .joblib files into the /app folder
COPY . .