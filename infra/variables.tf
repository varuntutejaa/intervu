variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Short name used to prefix/tag every resource this config creates."
  type        = string
  default     = "intervu"
}

variable "environment" {
  description = "Deployment environment name (e.g. prod, staging)."
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC this stack creates."
  type        = string
  default     = "10.20.0.0/16"
}

variable "backend_instance_type" {
  description = "EC2 instance type running the Node backend (pm2, matches .github/workflows/deploy.yml)."
  type        = string
  default     = "t3.micro"
}

variable "ec2_key_pair_name" {
  description = "Name of an existing EC2 key pair for SSH access. Create one in the AWS console/CLI first — Terraform doesn't manage the private key."
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "CIDR allowed to SSH into the backend instance. Restrict this to your own IP (x.x.x.x/32) — 0.0.0.0/0 is not safe for anything beyond a throwaway demo."
  type        = string
}

variable "db_name" {
  description = "Postgres database name."
  type        = string
  default     = "intervu"
}

variable "db_username" {
  description = "Postgres master username."
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Postgres master password. Pass via TF_VAR_db_password or a .tfvars file that's gitignored — never commit this."
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "cognito_user_pool_arn" {
  description = "ARN of the existing Cognito User Pool the backend authenticates against (created manually — see README). Used to scope the EC2 instance's IAM policy to exactly this pool, not every Cognito pool on the account."
  type        = string
}

variable "domain_name" {
  description = "Optional custom domain for the CloudFront frontend distribution. Leave blank to use the default *.cloudfront.net domain."
  type        = string
  default     = ""
}
