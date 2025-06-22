variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "project_number" {
  description = "The GCP project number"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "The application name"
  type        = string
  default     = "tennis-connect"
}

variable "environment" {
  description = "The deployment environment"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "db_tier" {
  description = "The database tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_name" {
  description = "The database name"
  type        = string
  default     = "tennis_connect_prod"
}

variable "db_user" {
  description = "The database user"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "The database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "tennis-connect"
}

variable "github_branch" {
  description = "GitHub branch to trigger builds"
  type        = string
  default     = "main"
} 