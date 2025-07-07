# Use official Node.js image as the base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the app
COPY . .

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start the Express backend
CMD ["node", "server.js"] 