output "backend_public_ip" {
  description = "SSH/deploy target for .github/workflows/deploy.yml's EC2_HOST secret."
  value       = aws_instance.backend.public_ip
}

output "backend_api_url" {
  value = "http://${aws_instance.backend.public_ip}:3001"
}

output "db_endpoint" {
  description = "RDS endpoint for backend/.env's PGHOST."
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "frontend_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "cloudfront_domain_name" {
  description = "PUBLIC_URL for backend/.env — this, not the raw EC2 address."
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}

output "github_actions_deployer_role_arn" {
  description = "role-to-assume for a GitHub Actions OIDC-based deploy step, replacing the current static AWS access keys."
  value       = aws_iam_role.github_actions_deployer.arn
}
