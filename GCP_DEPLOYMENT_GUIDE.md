# Tennis Connect - Google Cloud Platform Deployment Guide

This guide provides step-by-step instructions for deploying the Tennis Connect application to Google Cloud Platform (GCP).

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Quick Deployment](#quick-deployment)
4. [Manual Deployment](#manual-deployment)
5. [Post-Deployment](#post-deployment)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to GCP, ensure you have:

### Required Tools
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (latest version)
- [Terraform](https://www.terraform.io/downloads) (>= 1.0)
- [Docker](https://docs.docker.com/get-docker/) (latest version)
- [Git](https://git-scm.com/downloads)

### GCP Requirements
- A GCP project with billing enabled
- Project Owner or Editor role
- APIs enabled (done automatically by deployment script):
  - Cloud Build API
  - Cloud Run API
  - Cloud SQL Admin API
  - Artifact Registry API
  - Compute Engine API

### Verify Installation
```bash
# Check if tools are installed
gcloud --version
terraform --version
docker --version
git --version

# Login to Google Cloud
gcloud auth login
gcloud auth application-default login
```

## Initial Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/tennis-connect.git
cd tennis-connect
```

### 2. Create GCP Project (if needed)
```bash
# Create a new project
gcloud projects create YOUR-PROJECT-ID --name="Tennis Connect"

# Set billing account (replace with your billing account ID)
gcloud beta billing projects link YOUR-PROJECT-ID --billing-account=YOUR-BILLING-ACCOUNT-ID
```

### 3. Configure Environment
```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID
```

## Quick Deployment

### Automated Deployment Script
For a one-click deployment, use our automated script:

```bash
# 1. Edit the deployment script
nano scripts/deploy-gcp.sh

# 2. Set your PROJECT_ID in the script
PROJECT_ID="your-gcp-project-id"

# 3. Run the deployment
./scripts/deploy-gcp.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Enable required GCP APIs
- ✅ Deploy infrastructure with Terraform
- ✅ Build and push Docker images
- ✅ Deploy to Cloud Run
- ✅ Display deployment information

## Manual Deployment

If you prefer to deploy manually or need more control:

### Step 1: Enable GCP APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable compute.googleapis.com
```

### Step 2: Deploy Infrastructure with Terraform
```bash
# Navigate to terraform directory
cd terraform

# Copy and edit terraform variables
cp tf.prod.tfvars terraform.tfvars

# Edit the terraform.tfvars file with your values
nano terraform.tfvars
```

**Edit terraform.tfvars:**
```hcl
project_id     = "your-gcp-project-id"
project_number = "123456789012"  # Find in GCP Console
region         = "us-central1"
app_name       = "tennis-connect"
environment    = "production"
db_tier        = "db-n1-standard-1"
db_name        = "tennis_connect_prod"
db_user        = "postgres"
db_password    = "your-strong-password"
jwt_secret     = "your-jwt-secret-key"
github_owner   = "your-github-username"
github_repo    = "tennis-connect"
github_branch  = "main"
```

```bash
# Initialize and apply Terraform
terraform init
terraform plan
terraform apply
```

### Step 3: Build and Push Docker Images
```bash
# Return to project root
cd ..

# Configure Docker for GCR
gcloud auth configure-docker

# Build backend image
docker build -t gcr.io/$PROJECT_ID/tennis-connect-backend:latest ./backend
docker push gcr.io/$PROJECT_ID/tennis-connect-backend:latest

# Build frontend image  
docker build \
  --build-arg REACT_APP_API_URL=https://tennis-connect-backend-HASH.run.app/api \
  --build-arg REACT_APP_ENV=production \
  -t gcr.io/$PROJECT_ID/tennis-connect-frontend:latest \
  ./frontend
docker push gcr.io/$PROJECT_ID/tennis-connect-frontend:latest
```

### Step 4: Deploy to Cloud Run
```bash
# Deploy backend service
gcloud run deploy tennis-connect-backend \
  --image gcr.io/$PROJECT_ID/tennis-connect-backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "APP_ENV=production,DB_HOST=YOUR_DB_CONNECTION_NAME,DB_USER=postgres,DB_PASSWORD=YOUR_PASSWORD,DB_NAME=tennis_connect_prod,JWT_SECRET=YOUR_JWT_SECRET" \
  --memory 512Mi \
  --cpu 1

# Deploy frontend service
gcloud run deploy tennis-connect-frontend \
  --image gcr.io/$PROJECT_ID/tennis-connect-frontend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 80 \
  --memory 256Mi \
  --cpu 1
```

## Post-Deployment

### 1. Get Service URLs
```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe tennis-connect-backend --region=us-central1 --format='value(status.url)')

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe tennis-connect-frontend --region=us-central1 --format='value(status.url)')

echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
```

### 2. Test Deployment
```bash
# Test backend health
curl $BACKEND_URL/api/health

# Test frontend (should return HTML)
curl $FRONTEND_URL
```

### 3. Run Database Migrations
Connect to your Cloud SQL instance and run migrations:

```bash
# Connect to Cloud SQL
gcloud sql connect tennis-connect-db-production --user=postgres

# Run migrations (from your backend)
# You may need to run this from a Cloud Shell or compute instance
```

### 4. Configure Custom Domain (Optional)
```bash
# Map custom domain to Cloud Run service
gcloud run domain-mappings create --service tennis-connect-frontend --domain your-domain.com --region us-central1
```

## Monitoring and Maintenance

### Set up Monitoring
1. Go to GCP Console → Monitoring
2. Create alerting policies for:
   - High CPU usage
   - High memory usage
   - Service downtime
   - Database connections

### Regular Maintenance
```bash
# View logs
gcloud logs tail --follow --resource-type cloud_run_revision --resource-name tennis-connect-backend

# Update services
gcloud run services update tennis-connect-backend --region us-central1

# Scale services
gcloud run services update tennis-connect-backend --concurrency 100 --region us-central1
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check Cloud Build logs
gcloud builds list
gcloud builds log BUILD_ID
```

#### 2. Service Not Accessible
```bash
# Check service status
gcloud run services describe tennis-connect-backend --region us-central1

# Check IAM permissions
gcloud run services get-iam-policy tennis-connect-backend --region us-central1
```

#### 3. Database Connection Issues
```bash
# Test database connectivity
gcloud sql connect tennis-connect-db-production --user=postgres

# Check Cloud SQL logs
gcloud sql operations list --instance tennis-connect-db-production
```

#### 4. Environment Variables
```bash
# Update environment variables
gcloud run services update tennis-connect-backend \
  --set-env-vars "NEW_VAR=value" \
  --region us-central1
```

### Useful Commands

```bash
# View all Cloud Run services
gcloud run services list

# View service details
gcloud run services describe SERVICE_NAME --region us-central1

# View logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=tennis-connect-backend" --limit 50

# Delete service
gcloud run services delete SERVICE_NAME --region us-central1

# Terraform destroy (careful!)
cd terraform && terraform destroy
```

## Cost Optimization

### Recommendations
1. **Use appropriate instance sizes**: Start with smaller instances and scale up as needed
2. **Set up auto-scaling**: Configure min/max instances for Cloud Run
3. **Monitor usage**: Use GCP's cost monitoring tools
4. **Use regional databases**: Avoid cross-region data transfer costs
5. **Implement caching**: Use Cloud CDN for static assets

### Estimated Costs
- Cloud Run (Backend): ~$5-20/month
- Cloud Run (Frontend): ~$3-10/month  
- Cloud SQL: ~$15-50/month
- Storage: ~$1-5/month
- **Total: ~$25-85/month** for small to medium traffic

## Security Considerations

1. **Use IAM roles**: Follow principle of least privilege
2. **Enable SSL**: All traffic is encrypted by default with Cloud Run
3. **Database security**: Use strong passwords and SSL connections
4. **Secrets management**: Use Google Secret Manager for sensitive data
5. **Network security**: Configure VPC and firewall rules if needed

## Next Steps

1. **Set up CI/CD**: Use the included `cloudbuild.yaml` for automated deployments
2. **Custom domain**: Configure your own domain name
3. **Monitoring**: Set up comprehensive monitoring and alerting
4. **Backup strategy**: Implement regular database backups
5. **Performance optimization**: Monitor and optimize application performance

---

For additional help, refer to:
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Google Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs) 