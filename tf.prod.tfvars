# Production Terraform Variables for Tennis Connect
# Copy this file and fill in the actual values

# GCP Project Configuration
project_id     = "your-gcp-project-id"
project_number = "your-gcp-project-number"
region         = "us-central1"

# Application Configuration
app_name    = "tennis-connect"
environment = "production"

# Database Configuration
db_tier     = "db-n1-standard-1"  # Use more powerful instance for production
db_name     = "tennis_connect_prod"
db_user     = "postgres"
db_password = "REPLACE_WITH_STRONG_PASSWORD"

# Security Configuration
jwt_secret = "REPLACE_WITH_STRONG_JWT_SECRET"

# GitHub Configuration
github_owner  = "your-github-username"
github_repo   = "tennis-connect"
github_branch = "main" 