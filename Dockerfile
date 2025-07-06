# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Expose port
EXPOSE 8080

# Start the server using the start script
CMD ["npm", "start"] 