# Use official Node.js image as the base
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies (only those needed for build)
RUN npm ci

# Copy the rest of the app
COPY . .

# Build the frontend
RUN npm run build

# --- Production image ---
FROM node:18-alpine

# Install serve to serve static files
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy built frontend from build stage
COPY --from=build /app/dist ./dist

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start the static server
CMD ["serve", "-s", "dist", "-l", "8080"] 