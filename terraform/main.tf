terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud SQL Database Instance
resource "google_sql_database_instance" "tennis_connect_db" {
  name             = "${var.app_name}-db-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region
  deletion_protection = var.environment == "production" ? true : false

  settings {
    tier = var.db_tier
    
    ip_configuration {
      ipv4_enabled    = true
      authorized_networks {
        name  = "allow-all"
        value = "0.0.0.0/0"
      }
    }

    backup_configuration {
      enabled                        = true
      start_time                    = "03:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 7
      }
    }

    maintenance_window {
      day          = 7
      hour         = 4
      update_track = "stable"
    }
  }
}

# Database
resource "google_sql_database" "tennis_connect" {
  name     = var.db_name
  instance = google_sql_database_instance.tennis_connect_db.name
}

# Database User
resource "google_sql_user" "tennis_connect_user" {
  name     = var.db_user
  instance = google_sql_database_instance.tennis_connect_db.name
  password = var.db_password
}

# Cloud Storage Bucket for static assets
resource "google_storage_bucket" "tennis_connect_assets" {
  name          = "${var.project_id}-${var.app_name}-assets"
  location      = var.region
  force_destroy = var.environment != "production"

  uniform_bucket_level_access = true
  
  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Cloud Storage Bucket IAM
resource "google_storage_bucket_iam_member" "public_access" {
  count  = var.environment != "production" ? 1 : 0
  bucket = google_storage_bucket.tennis_connect_assets.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Artifact Registry Repository
resource "google_artifact_registry_repository" "tennis_connect_repo" {
  location      = var.region
  repository_id = "${var.app_name}-repo"
  description   = "Tennis Connect application images"
  format        = "DOCKER"
}

# Cloud Build Trigger
resource "google_cloudbuild_trigger" "tennis_connect_trigger" {
  name        = "${var.app_name}-trigger"
  description = "Build and deploy Tennis Connect application"

  github {
    owner = var.github_owner
    name  = var.github_repo
    push {
      branch = var.github_branch
    }
  }

  filename = "cloudbuild.yaml"

  substitutions = {
    _SERVICE_NAME = var.app_name
    _REGION       = var.region
    _DB_HOST      = google_sql_database_instance.tennis_connect_db.connection_name
    _DB_USER      = var.db_user
    _DB_NAME      = var.db_name
  }
}

# IAM role for Cloud Build
resource "google_project_iam_member" "cloudbuild_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${var.project_number}@cloudbuild.gserviceaccount.com"
}

resource "google_project_iam_member" "cloudbuild_run" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${var.project_number}@cloudbuild.gserviceaccount.com"
}

resource "google_project_iam_member" "cloudbuild_iam" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${var.project_number}@cloudbuild.gserviceaccount.com"
} 