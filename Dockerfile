FROM node:20-slim

# Install system dependencies for native modules compiles (node-canvas, better-sqlite3), ffmpeg, and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    ffmpeg \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Clean installation of npm dependencies
RUN npm install --no-audit --no-fund

COPY . .

# Build Vite client files and CJS production backend
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
