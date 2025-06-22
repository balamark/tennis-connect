output "database_instance_connection_name" {
  description = "Connection name of the Cloud SQL instance"
  value       = google_sql_database_instance.tennis_connect_db.connection_name
}

output "database_instance_ip" {
  description = "IP address of the Cloud SQL instance"
  value       = google_sql_database_instance.tennis_connect_db.ip_address
}

output "database_name" {
  description = "Name of the database"
  value       = google_sql_database.tennis_connect.name
}

output "storage_bucket_name" {
  description = "Name of the storage bucket"
  value       = google_storage_bucket.tennis_connect_assets.name
}

output "storage_bucket_url" {
  description = "URL of the storage bucket"
  value       = google_storage_bucket.tennis_connect_assets.url
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository URL"
  value       = google_artifact_registry_repository.tennis_connect_repo.name
}

output "cloudbuild_trigger_name" {
  description = "Name of the Cloud Build trigger"
  value       = google_cloudbuild_trigger.tennis_connect_trigger.name
} 