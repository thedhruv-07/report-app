# Use Node.js 20 on Debian slim
FROM node:20-slim

# Install LibreOffice (core only, ~200MB instead of full ~800MB)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libreoffice-core libreoffice-writer fonts-dejavu && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package.json package-lock.json ./

# Install Node.js dependencies
RUN npm ci --production

# Copy the rest of the application code
COPY . .

# Expose the backend port
EXPOSE 10000

# Start the server
CMD ["node", "server.js"]
