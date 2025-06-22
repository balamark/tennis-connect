#!/bin/bash

# Tennis Connect - Google Cloud Platform Deployment Script
# This script sets up the GCP infrastructure and deploys the Tennis Connect application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="tennis-connect-1750069323"
REGION="us-central1"
APP_NAME="tennis-connect"
ENVIRONMENT="production"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Check if terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install it from https://www.terraform.io/downloads"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it from https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to setup GCP project
setup_gcp_project() {
    print_status "Setting up GCP project..."
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "PROJECT_ID is not set. Please edit this script and set your GCP project ID."
        exit 1
    fi
    
    # Set the project
    gcloud config set project $PROJECT_ID
    
    # Enable required APIs
    print_status "Enabling required GCP APIs..."
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable sql-component.googleapis.com
    gcloud services enable sqladmin.googleapis.com
    gcloud services enable artifactregistry.googleapis.com
    gcloud services enable compute.googleapis.com
    
    print_success "GCP project setup completed"
}

# Function to deploy infrastructure with Terraform
deploy_infrastructure() {
    print_status "Deploying infrastructure with Terraform..."
    
    cd terraform
    
    # Initialize Terraform
    terraform init
    
    # Check if tfvars file exists
    if [ ! -f "terraform.tfvars" ]; then
        print_warning "terraform.tfvars not found. Please create it based on tf.prod.tfvars"
        print_status "Copying tf.prod.tfvars to terraform.tfvars..."
        cp tf.prod.tfvars terraform.tfvars
        print_warning "Please edit terraform.tfvars with your actual values before continuing"
        read -p "Press Enter to continue after editing terraform.tfvars..."
    fi
    
    # Plan the deployment
    terraform plan
    
    # Ask for confirmation
    read -p "Do you want to apply these changes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        terraform apply -auto-approve
    else
        print_warning "Deployment cancelled"
        exit 1
    fi
    
    cd ..
    print_success "Infrastructure deployment completed"
}

# Function to configure Docker authentication
configure_docker_auth() {
    print_status "Configuring Docker authentication for GCR..."
    gcloud auth configure-docker
    print_success "Docker authentication configured"
}

# Function to build and push images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -t gcr.io/$PROJECT_ID/$APP_NAME-backend:latest ./backend
    docker push gcr.io/$PROJECT_ID/$APP_NAME-backend:latest
    
    # Build frontend image
    print_status "Building frontend image..."
    BACKEND_URL="https://$APP_NAME-backend-$(gcloud run services describe $APP_NAME-backend --region=$REGION --format='value(status.url)' | cut -d'/' -f3 | cut -d'.' -f1).run.app"
    docker build \
        --build-arg REACT_APP_API_URL=$BACKEND_URL/api \
        --build-arg REACT_APP_ENV=production \
        -t gcr.io/$PROJECT_ID/$APP_NAME-frontend:latest \
        ./frontend
    docker push gcr.io/$PROJECT_ID/$APP_NAME-frontend:latest
    
    print_success "Images built and pushed successfully"
}

# Function to deploy to Cloud Run
deploy_to_cloud_run() {
    print_status "Deploying to Cloud Run..."
    
    # Deploy backend
    print_status "Deploying backend service..."
    gcloud run deploy $APP_NAME-backend \
        --image gcr.io/$PROJECT_ID/$APP_NAME-backend:latest \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --set-env-vars "APP_ENV=production" \
        --memory 512Mi \
        --cpu 1
    
    # Deploy frontend
    print_status "Deploying frontend service..."
    gcloud run deploy $APP_NAME-frontend \
        --image gcr.io/$PROJECT_ID/$APP_NAME-frontend:latest \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --port 80 \
        --memory 256Mi \
        --cpu 1
    
    print_success "Cloud Run deployment completed"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Get the backend service URL
    BACKEND_URL=$(gcloud run services describe $APP_NAME-backend --region=$REGION --format='value(status.url)')
    
    print_status "Backend service is available at: $BACKEND_URL"
    print_warning "Please manually run database migrations if needed"
}

# Function to display deployment information
show_deployment_info() {
    print_success "Deployment completed successfully!"
    echo
    echo "=== Deployment Information ==="
    
    # Get service URLs
    BACKEND_URL=$(gcloud run services describe $APP_NAME-backend --region=$REGION --format='value(status.url)')
    FRONTEND_URL=$(gcloud run services describe $APP_NAME-frontend --region=$REGION --format='value(status.url)')
    
    echo "Frontend URL: $FRONTEND_URL"
    echo "Backend API URL: $BACKEND_URL"
    echo
    echo "=== Next Steps ==="
    echo "1. Test your application at the frontend URL"
    echo "2. Configure custom domain if needed"
    echo "3. Set up monitoring and alerting"
    echo "4. Configure SSL certificates if using custom domain"
    echo
    print_success "Tennis Connect is live on Google Cloud!"
}

# Main deployment function
main() {
    echo "=== Tennis Connect - GCP Deployment ==="
    echo
    
    check_prerequisites
    setup_gcp_project
    deploy_infrastructure
    configure_docker_auth
    build_and_push_images
    deploy_to_cloud_run
    run_migrations
    show_deployment_info
}

# Run the main function
main "$@" 