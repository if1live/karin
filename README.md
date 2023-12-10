## deploy

1. RabbitMQ: `infra/rabbitmq/README.md`
2. terraform: `infra/terraform/README.md`

```bash
fly deploy

fly secrets set AWS_REGION=TODO_AWS_REGION
fly secrets set AWS_ACCESS_KEY_ID=TODO_AWS_ACCESS_KEY_ID
fly secrets set AWS_SECRET_ACCESS_KEY=TODO_AWS_SECRET_ACCESS_KEY

fly secrets set FLY_REDIS_URL=TODO_FLY_REDIS_URL

# 비용 줄이려고 machine은 1개만 사용
fly scale show
fly scale count 1
```
