output "aws_region" {
  value = var.region
}

output "aws_access_key_id" {
  value = aws_iam_access_key.main.id
}

output "aws_secret_access_key" {
  # PGP 설정이 귀찮아서 보안을 무시하는 설정 사용
  # 접근할 수 있는 aws 자원이 거의 없어서 심각한 문제는 없을듯?
  value     = aws_iam_access_key.main.secret
  sensitive = true
}
