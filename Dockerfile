FROM node:22-alpine

# Metadata labels
LABEL maintainer="CYLON Central Intelligence"
LABEL version="3.2"
LABEL description="AI Swarm OS - Multi-Agent Orchestration with MDM & Vision AI"

# Set working directory
WORKDIR /app

# Install system dependencies (build-essential equivalent for alpine if needed for better-sqlite3)
RUN apk add --no-cache python3 make g++ 

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Default Environment Variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the production application port
EXPOSE 3000

# Start the compiled production server
CMD ["node", "dist/server.cjs"]
