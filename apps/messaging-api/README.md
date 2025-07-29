# Gov-IE - messaging API

This application is used to manage user messagings for Gov-IE.

## Docker

From the root folder

```bash
docker build -t base-deps -f Dockerfile .
docker build -t messaging-api:latest -f apps/messaging-api/Dockerfile .
```

```bash
docker run -p 8002:8002 --env-file apps/messaging-api/.env messaging-api
```