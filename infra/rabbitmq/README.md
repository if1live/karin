# rabbitmq

```bash
# 배포
fly deploy

# 권한 설정
fly secrets set RABBITMQ_DEFAULT_USER=TODO_admin
fly secrets set RABBITMQ_DEFAULT_PASS=TODO_password

# 비용 줄이려고 machine은 1개만 사용
fly scale show
fly scale count 1

# management 접속. 외부 접속이 막혀있어서 프록시 써야한다.
# localhost에서의 충돌을 피하려고 프록시의 포트번호는 기본값과 다르게 설정.
fly proxy --app miyako-rabbitmq 15673:15672
http://localhost:15673/
```

## note
https://medium.com/@stefannovak96/hosting-rabbitmq-on-fly-io-in-5-minutes-e749dbb476f1

## plugins

```erlang
[
	rabbitmq_management,
	rabbitmq_mqtt,
	rabbitmq_web_mqtt,
	rabbitmq_stomp,
	rabbitmq_web_stomp
].
```
