
### On QA VMs:

To roll out latest version:

```
docker pull cresendifyqa.azurecr.io/dispatch_api/qa/dispatch_api:latest
docker compose -p dispatch_api -f /home/azureuser/dispatch_api/dispatch_api.docker-compse.yaml down
docker compose -p dispatch_api -f /home/azureuser/dispatch_api/dispatch_api.docker-compse.yaml up -d api
```
