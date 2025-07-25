# Tennis Connect - GCP Deployment Guide

This guide will help you deploy Tennis Connect to Google Cloud Platform using Cloud Run and Cloud SQL.

## Prerequisites

1. **Google Cloud Platform Account**: You need a GCP account with billing enabled
2. **Google Cloud CLI**: Install from [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
3. **GitHub Repository**: Your code should be in a GitHub repository
4. **Docker**: For local testing (optional)

## Architecture

The application will be deployed using:
- **Google Cloud Run**: For backend API and frontend hosting
- **Google Artifact Registry**: For Docker image storage
- **Supabase**: For PostgreSQL database (managed cloud database)
- **GitHub Actions**: For CI/CD pipeline

## Quick Setup

### 1. Run the Setup Script

We've provided an automated setup script that configures all necessary GCP resources:

```bash
./scripts/setup-gcp.sh
```

This script will:
- Enable required GCP APIs
- Create Artifact Registry repository
- Set up service account with proper permissions
- Optionally create Cloud SQL instance
- Generate service account key for GitHub Actions

### 2. Configure GitHub Secrets

After running the setup script, add these secrets to your GitHub repository:

Go to: `Repository Settings → Secrets and variables → Actions`

Add the following repository secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `GCP_PROJECT_ID` | Your GCP Project ID | `my-tennis-app-123456` |
| `GCP_SA_KEY` | Service account JSON key | `{"type": "service_account", ...}` |
| `DB_HOST` | Supabase database host | `db.xxxxxxxxxx.supabase.co` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Supabase database password | `your-supabase-password` |
| `JWT_SECRET` | JWT signing secret | `your-super-secure-jwt-secret-32-chars+` |

### 3. Deploy

Once secrets are configured, simply push to the `main` branch:

```bash
git add .
git commit -m "Deploy to GCP"
git push origin main
```

The GitHub Action will automatically:
1. Build Docker images for backend and frontend
2. Push images to Google Artifact Registry
3. Deploy services to Cloud Run
4. Output the URLs for your deployed services

## Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Enable APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

### 2. Create Artifact Registry

```bash
gcloud artifacts repositories create tennis-connect \
    --repository-format=docker \
    --location=us-central1 \
    --description="Tennis Connect application images"
```

### 3. Create Service Account

```bash
# Create service account
gcloud iam service-accounts create tennis-connect-github-actions \
    --display-name="Tennis Connect GitHub Actions"

# Grant roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:tennis-connect-github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:tennis-connect-github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:tennis-connect-github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"
```

### 4. Create Service Account Key

```bash
gcloud iam service-accounts keys create tennis-connect-sa-key.json \
    --iam-account=tennis-connect-github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

## Database: Supabase (Current Setup)

### ✅ Current: Supabase PostgreSQL

The application now uses **Supabase** as the managed PostgreSQL database:

**Benefits:**
- ✅ **$0/month** with generous free tier (500MB database, 5GB bandwidth)
- ✅ **Automatic backups** and point-in-time recovery
- ✅ **Built-in authentication** and real-time features
- ✅ **Web-based management** interface
- ✅ **No maintenance** required

**Setup:**
1. Create account at [Supabase.com](https://supabase.com)
2. Create new project: `tennis-connect`
3. Get connection details from Settings → Database
4. Update GitHub secrets with Supabase credentials

### Alternative: Other External Databases

You can also use:
- **Neon**: Serverless PostgreSQL with autoscaling
- **PlanetScale**: MySQL with branching (requires schema changes)
- **Railway**: PostgreSQL hosting with simple pricing

## Local Testing

To test the deployment configuration locally:

```bash
# Build images
docker build -t tennis-backend ./backend
docker build --target production -t tennis-frontend ./frontend

# Test with production compose
docker-compose -f docker-compose.prod.yml up
```

## Monitoring and Logs

After deployment, you can monitor your services:

```bash
# View Cloud Run services
gcloud run services list

# View logs for backend
gcloud logs read --service=tennis-connect-backend

# View logs for frontend  
gcloud logs read --service=tennis-connect-frontend
```

## Troubleshooting

### Common Issues

1. **Build Failures**: Check that all environment variables are set correctly in GitHub secrets
2. **Database Connection Issues**: Ensure Cloud SQL instance is accessible and credentials are correct
3. **Permission Errors**: Verify service account has all required roles

### Debug Commands

```bash
# Check service status
gcloud run services describe tennis-connect-backend --region=us-central1

# View recent logs
gcloud logs read --limit=50 --service=tennis-connect-backend

# Test service locally
curl https://tennis-connect-backend-YOUR_PROJECT_ID.a.run.app/api/health
```

## Cost Optimization

- **Cloud Run**: Pay only for requests and compute time (~$0-5/month for small apps)
- **Supabase**: Free tier covers most small to medium applications ($0/month)
- **Artifact Registry**: Minimal storage costs for Docker images (~$1-2/month)

**Total estimated cost: $1-7/month** (compared to $15-25/month with Cloud SQL)

For production, consider:
- Enabling Cloud Run autoscaling
- Monitoring Supabase usage limits
- Setting up alerting for cost spikes

## Security Considerations

1. **Database**: Supabase enforces SSL by default (`DB_SSLMODE=require`)
2. **JWT Secret**: Use a strong, randomly generated secret (32+ characters)
3. **Service Account**: Use minimal required permissions for GCP resources
4. **Environment Variables**: Never commit secrets to git
5. **Supabase**: Enable Row Level Security (RLS) policies for data protection
6. **API Keys**: Use separate keys for development and production

## Next Steps

After successful deployment:
1. Set up custom domain names
2. Configure SSL certificates
3. Set up monitoring and alerting
4. Configure backup strategies
5. Set up staging environment

For questions or issues, check the GitHub Actions logs and Cloud Console for detailed error messages. 