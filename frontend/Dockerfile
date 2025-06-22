# Multi-stage Dockerfile for both development and production

# Development stage
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Fix permissions for react-scripts
RUN chmod +x node_modules/.bin/*

# Environment variables for development
ENV BROWSER=none
ENV CHOKIDAR_USEPOLLING=true
ENV REACT_APP_API_URL=http://localhost:8080/api
ENV REACT_APP_ENV=development

# Expose port 3000 for development server
EXPOSE 3000

# Start development server
CMD ["npm", "start"]

# Build stage for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install

# Copy source files
COPY . .

# Build arguments for production
ARG REACT_APP_API_URL
ARG REACT_APP_ENV=production

# Fix permissions and build the React application
RUN chmod +x node_modules/.bin/* && npm run build

# Production stage
FROM nginx:alpine AS production

# Copy build output from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration (if you have one)
COPY nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY start-nginx.sh /start-nginx.sh
RUN chmod +x /start-nginx.sh

# Expose port 80
EXPOSE 80

# Command to run
CMD ["/start-nginx.sh"] 