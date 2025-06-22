# Build stage
FROM golang:1.23-alpine AS builder

# Install git for go modules that might need it
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o tennis-connect-api .

# Final stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates

# Set working directory
WORKDIR /root/

# Copy binary from builder stage
COPY --from=builder /app/tennis-connect-api .
COPY --from=builder /app/migrations ./migrations/

# Expose port
EXPOSE 8080

# Command to run
CMD ["./tennis-connect-api"] 