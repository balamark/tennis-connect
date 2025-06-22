# Build stage
FROM node:18-alpine AS builder

# Set working directory
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
FROM nginx:alpine

# Copy build output from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy startup script
COPY start-nginx.sh /start-nginx.sh
RUN chmod +x /start-nginx.sh

# Expose port
EXPOSE 8080

# Command to run
CMD ["/start-nginx.sh"] 