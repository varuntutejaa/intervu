# CI deploy credentials via GitHub's OIDC provider instead of long-lived
# IAM access keys — nothing to leak from GitHub Secrets, nothing secret
# sitting in Terraform state. The existing .github/workflows/deploy-frontend.yml
# uses static AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY secrets today; adopting
# this role means swapping that step for aws-actions/configure-aws-credentials's
# `role-to-assume: aws_iam_role.github_actions_deployer.arn` and deleting
# those two secrets — recommended, not yet done, since it's a workflow change
# outside this Terraform config.

variable "github_repo" {
  description = "GitHub repo allowed to assume the deployer role, as \"owner/repo\"."
  type        = string
  default     = "varuntutejaa/intervu"
}

resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  # GitHub's OIDC thumbprint — see
  # https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

data "aws_iam_policy_document" "github_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Only workflow runs triggered from this exact repo's main branch can
    # assume this role — not forks, not other branches/PRs.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "github_actions_deployer" {
  name               = "${var.project}-${var.environment}-github-deployer"
  assume_role_policy = data.aws_iam_policy_document.github_assume_role.json
}

# Least privilege: exactly the two actions the frontend deploy workflow
# runs (`aws s3 sync`, `aws cloudfront create-invalidation`), scoped to
# exactly this bucket and this distribution — nothing account-wide.
data "aws_iam_policy_document" "github_deployer_permissions" {
  statement {
    sid    = "SyncFrontendBucket"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.frontend.arn,
      "${aws_s3_bucket.frontend.arn}/*",
    ]
  }

  statement {
    sid       = "InvalidateFrontendDistribution"
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [aws_cloudfront_distribution.frontend.arn]
  }
}

resource "aws_iam_role_policy" "github_deployer" {
  name   = "${var.project}-${var.environment}-github-deployer-policy"
  role   = aws_iam_role.github_actions_deployer.id
  policy = data.aws_iam_policy_document.github_deployer_permissions.json
}
