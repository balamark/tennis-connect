#!/bin/sh

# Get the port from Cloud Run's PORT environment variable, default to 8080
PORT=${PORT:-8080}

# Create nginx config with the correct port
cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen ${PORT};
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Enable compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss text/javascript;

    # Don't compress images
    gzip_disable "MSIE [1-6]\.(?!.*SV1)";

    # Frontend routes
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Error handling
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# Start nginx
nginx -g "daemon off;" 