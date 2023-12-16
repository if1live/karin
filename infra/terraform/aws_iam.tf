resource "aws_iam_user" "main" {
  name = "karin"
  path = "/karin/"
}

resource "aws_iam_access_key" "main" {
  user    = aws_iam_user.main.name
}

# https://docs.aws.amazon.com/lambda/latest/dg/access-control-identity-based.html
resource "aws_iam_user_policy" "main_ro" {
  name = "karin"
  user = aws_iam_user.main.name

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "lambda:ListFunctions",
        "lambda:ListEventSourceMappings",
        "lambda:ListFunctionUrlConfigs",
        "lambda:InvokeFunction"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}
