data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_security_group" "backend" {
  name        = "${var.project}-${var.environment}-backend-sg"
  description = "Backend API — HTTP from CloudFront/anywhere, SSH from an allowlisted IP only."
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "API"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH (deploy + maintenance)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-${var.environment}-backend-sg" }
}

# Least-privilege: the backend's only direct AWS API calls (see
# backend/src/lib/cognito.ts) are these four Cognito actions, scoped to the
# one User Pool it actually authenticates against — not
# AmazonCognitoPowerUser, not a wildcard, and nothing else on the account.
data "aws_iam_policy_document" "backend_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "backend_cognito" {
  statement {
    sid    = "CognitoAuthOperationsOnly"
    effect = "Allow"
    actions = [
      "cognito-idp:SignUp",
      "cognito-idp:ConfirmSignUp",
      "cognito-idp:ResendConfirmationCode",
      "cognito-idp:InitiateAuth",
    ]
    resources = [var.cognito_user_pool_arn]
  }
}

resource "aws_iam_role" "backend" {
  name               = "${var.project}-${var.environment}-backend-role"
  assume_role_policy = data.aws_iam_policy_document.backend_assume_role.json
}

resource "aws_iam_role_policy" "backend_cognito" {
  name   = "${var.project}-${var.environment}-backend-cognito"
  role   = aws_iam_role.backend.id
  policy = data.aws_iam_policy_document.backend_cognito.json
}

resource "aws_iam_instance_profile" "backend" {
  name = "${var.project}-${var.environment}-backend-profile"
  role = aws_iam_role.backend.name
}

resource "aws_instance" "backend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.backend_instance_type
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.backend.id]
  iam_instance_profile   = aws_iam_instance_profile.backend.name
  key_name               = var.ec2_key_pair_name

  # Installs Node + pm2 and clones the repo so the very first
  # .github/workflows/deploy.yml run (git pull, npm ci, npm run build, pm2
  # start) has something to `git pull` into. Nothing app-specific runs
  # here — secrets (backend/.env) are provisioned separately (SSH/SSM),
  # never baked into this script or Terraform state.
  user_data = <<-EOF
    #!/bin/bash
    set -e
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs git
    npm install -g pm2
    git clone https://github.com/varuntutejaa/intervu.git /home/ubuntu/intervu
    chown -R ubuntu:ubuntu /home/ubuntu/intervu
  EOF

  tags = { Name = "${var.project}-${var.environment}-backend" }
}
