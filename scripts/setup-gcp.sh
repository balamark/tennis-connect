#!/bin/bash

# Tennis Connect - GCP Setup Script
# This script helps you set up the necessary GCP resources for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎾 Tennis Connect - GCP Setup${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI is not installed.${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
echo -e "${YELLOW}📝 Please enter your GCP Project ID:${NC}"
read -p "Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Project ID cannot be empty${NC}"
    exit 1
fi

# Set the project
echo -e "${YELLOW}🔧 Setting GCP project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔌 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com

# Create Artifact Registry repository
echo -e "${YELLOW}📦 Creating Artifact Registry repository...${NC}"
REGION=${REGION:-us-central1}
gcloud artifacts repositories create tennis-connect \
    --repository-format=docker \
    --location=$REGION \
    --description="Tennis Connect application images" || echo "Repository may already exist"

# Create service account for GitHub Actions
echo -e "${YELLOW}🔑 Creating service account for GitHub Actions...${NC}"
SA_NAME="tennis-connect-github-actions"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

gcloud iam service-accounts create $SA_NAME \
    --display-name="Tennis Connect GitHub Actions" \
    --description="Service account for GitHub Actions CI/CD" || echo "Service account may already exist"

# Grant necessary roles to the service account
echo -e "${YELLOW}🎭 Granting roles to service account...${NC}"
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/iam.serviceAccountUser"

# Create and download service account key
echo -e "${YELLOW}🗝️  Creating service account key...${NC}"
KEY_FILE="tennis-connect-sa-key.json"
gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account=$SA_EMAIL

# Create Cloud SQL instance (optional - for production database)
echo -e "${YELLOW}🗄️  Do you want to create a Cloud SQL PostgreSQL instance? (y/n):${NC}"
read -p "Create Cloud SQL instance: " CREATE_SQL

if [ "$CREATE_SQL" = "y" ] || [ "$CREATE_SQL" = "Y" ]; then
    echo -e "${YELLOW}📊 Creating Cloud SQL PostgreSQL instance...${NC}"
    
    # Generate a random password
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    gcloud sql instances create tennis-connect-db \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --root-password=$DB_PASSWORD \
        --storage-type=SSD \
        --storage-size=10GB \
        --availability-type=zonal || echo "SQL instance may already exist"
    
    # Create database
    gcloud sql databases create tennis_connect \
        --instance=tennis-connect-db || echo "Database may already exist"
    
    # Get the connection name
    CONNECTION_NAME=$(gcloud sql instances describe tennis-connect-db --format="value(connectionName)")
    
    echo -e "${GREEN}✅ Cloud SQL instance created!${NC}"
    echo -e "${YELLOW}📝 Database details:${NC}"
    echo "  Instance: tennis-connect-db"
    echo "  Database: tennis_connect"
    echo "  Connection Name: $CONNECTION_NAME"
    echo "  Root Password: $DB_PASSWORD"
    echo ""
    echo -e "${YELLOW}⚠️  Save this password! You'll need it for GitHub secrets.${NC}"
fi

# Instructions for GitHub secrets
echo ""
echo -e "${GREEN}✅ GCP setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps - Add these secrets to your GitHub repository:${NC}"
echo ""
echo "1. Go to your GitHub repository settings -> Secrets and variables -> Actions"
echo "2. Add the following repository secrets:"
echo ""
echo "   GCP_PROJECT_ID: $PROJECT_ID"
echo "   GCP_SA_KEY: <paste the contents of $KEY_FILE>"
echo ""

if [ "$CREATE_SQL" = "y" ] || [ "$CREATE_SQL" = "Y" ]; then
    echo "   DB_HOST: /cloudsql/$CONNECTION_NAME"
    echo "   DB_USER: postgres"
    echo "   DB_PASSWORD: $DB_PASSWORD"
else
    echo "   DB_HOST: <your database host>"
    echo "   DB_USER: <your database user>"
    echo "   DB_PASSWORD: <your database password>"
fi

echo "   JWT_SECRET: <your JWT secret key>"
echo ""
echo -e "${YELLOW}📄 Service account key saved to: $KEY_FILE${NC}"
echo -e "${RED}⚠️  Remember to delete this file after adding it to GitHub secrets!${NC}"
echo ""
echo -e "${YELLOW}🚀 Once secrets are added, push to main branch to trigger deployment!${NC}" 