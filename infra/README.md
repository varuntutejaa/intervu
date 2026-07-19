# Infrastructure (Terraform)

Describes the target AWS deployment environment: VPC, an EC2 instance running the backend (Node + pm2, matching `.github/workflows/deploy.yml`), an RDS Postgres instance, and an S3 + CloudFront static site for the frontend (matching `.github/workflows/deploy-frontend.yml`). IAM is scoped to least privilege throughout — see `ec2.tf` (Cognito actions only, scoped to one User Pool ARN) and `deployer.tf` (S3/CloudFront actions only, scoped to this project's own bucket/distribution, via GitHub OIDC rather than long-lived access keys).

**This has not been applied.** It was written to describe the deployment environment as code (a project requirement) without taking any real, billable, or hard-to-reverse action against a live AWS account — provisioning real infrastructure is a deliberate decision only you should make, with your own AWS credentials, after reviewing the plan.

Also note: the bucket name and CloudFront distribution ID currently hardcoded in `deploy-frontend.yml` were created manually (outside Terraform), so this config's `aws_s3_bucket.frontend`/`aws_cloudfront_distribution.frontend` would provision a **new**, separate bucket/distribution unless you either import the existing ones (`terraform import`) or update the workflow to point at whatever this config outputs.

## Usage

```bash
cd infra
terraform init
cp terraform.tfvars.example terraform.tfvars   # fill in your values
export TF_VAR_db_password="..."                # don't put this in the tfvars file
terraform plan                                  # review carefully before applying anything
terraform apply                                 # only once you're sure
```

## Requirements not covered here

- `backend/.env` (Cognito, Groq, OAuth secrets) is provisioned onto the EC2 instance separately (SSH/SSM), never through Terraform or baked into the AMI/user_data.
- No remote state backend is configured by default (local `terraform.tfstate`) — see the commented-out `backend "s3"` block in `versions.tf` for a team setup.
- Migrating `deploy-frontend.yml` from static AWS keys to the OIDC role in `deployer.tf` is a workflow change, not something this Terraform config can do on its own.
