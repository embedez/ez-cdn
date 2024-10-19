# Use an official Node.js runtime as the base image
FROM oven/bun:1

WORKDIR /app

# Install system dependencies including ffmpeg
RUN apt-get update && apt-get install -y \
  ffmpeg \
  libvips-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy package.json and bun.lockb (if you have one)
COPY package.json ./
COPY bun.lockb ./

# Install dependencies, excluding ffmpeg-static
RUN sed -i '/ffmpeg-static/d' package.json && \
  bun install --no-frozen-lockfile

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["bun", "run", "src/index.ts"]