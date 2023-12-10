## deploy

1. RabbitMQ: `infra/rabbitmq/README.md`
2. terraform: `infra/terraform/README.md`

```bash
fly deploy --ha=false

fly secrets set AWS_REGION=TODO_AWS_REGION
fly secrets set AWS_ACCESS_KEY_ID=TODO_AWS_ACCESS_KEY_ID
fly secrets set AWS_SECRET_ACCESS_KEY=TODO_AWS_SECRET_ACCESS_KEY
```
