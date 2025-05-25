# Build stage
FROM node:16-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the React application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build output from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Command to run
CMD ["nginx", "-g", "daemon off;"] 