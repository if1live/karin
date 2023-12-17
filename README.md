# karin

AWS Lambda sidecar

[![karin](packages/app/static/images/title_02.jpg)](https://www.pixiv.net/artworks/94151542)

## feature

* AWS Lambda
    * Listing Function URL
    * Listing Event Source Mapping
* Amazon SQS
    * SQS compatible Interface
    * Message Consumser that invoke AWS Lambda function

## deploy

1. terraform: `infra/terraform/README.md`

2. fly.io

```bash
fly deploy

# terraform
fly secrets set AWS_REGION=TODO_AWS_REGION
fly secrets set AWS_ACCESS_KEY_ID=TODO_AWS_ACCESS_KEY_ID
fly secrets set AWS_SECRET_ACCESS_KEY=TODO_AWS_SECRET_ACCESS_KEY

# db
fly secrets set DATABASE_URL=TODO_DATABASE_URL
fly secrets set REDIS_URL=TODO_REDIS_URL

# /admin
fly secrets set ADMIN_ID=TODO_ADMIN_ID
fly secrets set ADMIN_PW=TODO_ADMIN_PW

fly secrets set SENTRY_DSN=TODO_SENTRY_DSN

# machine은 1개만 쓰기
# worker가 2개 돌면 대기열 처리에서 중복된 메세지 호출이 발생할 수 있다.
fly scale show
fly scale count 1
```
