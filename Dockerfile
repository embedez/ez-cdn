# Use an official Node.js runtime as the base image
FROM oven/bun:1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    build-essential \
    gcc \
    g++ \
    make \
    python3 \
    libvips-dev \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy package.json and bun.lockb (if you have one)
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["bun", "run", "src/index.ts"]