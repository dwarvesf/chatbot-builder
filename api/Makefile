ifneq (,$(wildcard ./.env))
    include .env
    export
endif

install:
	bun install

start:
	bun start

init: redis pg

https-dev:
	caddy run --config ./build/Caddyfile.local

.PHONY: dev
dev:
	bun src/app.ts --watch

init-local: pg redis init-migration-tool

DOCKER_COMPOSE_BIN := docker-compose
PROJECT_NAME := chat-builder
COMPOSE := ${DOCKER_COMPOSE_BIN} -p ${PROJECT_NAME} -f build/docker-compose.yaml

local-docker-run: docker-build-local
	${COMPOSE} run --name dispatch-api-local --rm --service-ports api

caddy:
	${COMPOSE} up -d caddy

redis:
	${COMPOSE} up -d redis

redis-down:
	${COMPOSE} down redis

redis-redo: redis-down
	sleep 1
	make redis

pg:
	${COMPOSE} up -d pg

pg-down:
	${COMPOSE} down pg --volumes

reset-local: pg-down pg redis-down redis
	sleep 5
	make api-db-migrate

docker-build-migration-tool:
	docker build --pull -t dispatch_migration_tool -f build/local/migration_tool.Dockerfile --progress=plain .

api-db-migrate:
	${COMPOSE} run --rm migration-tool-local sh -c "npx db-migrate up -e local"

api-db-migrate-qa:
	${COMPOSE} run --rm migration-tool-qa sh -c "npx db-migrate up -e pg"

MIGRATE_TOOL_DIR := cd pkg/dispatch_migration &&

init-migration-tool:
	${MIGRATE_TOOL_DIR} npm install

db-redo: pg-down
	sleep 1
	make pg
	sleep 1
	make db-migrate
	make db-seed

db-seed:
	${MIGRATE_TOOL_DIR} PGPASSWORD=${DB_PASSWORD} psql --username=${DB_USERNAME} --dbname=${DB_NAME} --port=${DB_PORT} --host=${DB_HOST} < migrations/seeds.sql

db-dump:
	${MIGRATE_TOOL_DIR} PGPASSWORD=${DB_PASSWORD} pg_dump --username=${DB_USERNAME} --dbname=${DB_NAME} --port=${DB_PORT} --host=${DB_HOST} > migrations/dump.sql

db-dump-data:
	${MIGRATE_TOOL_DIR} PGPASSWORD=${DB_PASSWORD} pg_dump --username=${DB_USERNAME} --dbname=${DB_NAME} --port=${DB_PORT} --host=${DB_HOST} --data-only > migrations/dump-data.sql

db-load-data:
	${MIGRATE_TOOL_DIR} PGPASSWORD=${DB_PASSWORD} psql --username=${DB_USERNAME} --dbname=${DB_NAME} --port=${DB_PORT} --host=${DB_HOST} < migrations/dump-data.sql

new-migration-file:
	${MIGRATE_TOOL_DIR} npx db-migrate create ${name} --sql-file -e pg
	${MIGRATE_TOOL_DIR} cd migrations/sqls && rm *-${name}-down.sql 

generate-jwt-secret:
	openssl genrsa -out ./build/local/keypair.pem 2048
	openssl rsa -in ./build/local/keypair.pem -pubout -out ./build/local/publickey.crt

docker-build-local:
	docker build --pull -t dispatch_api -f build/local/api.Dockerfile --progress=plain .

docker-build-qa-amd64:
	docker build --pull --platform linux/amd64 -t dispatch_api -f build/qa/api.Dockerfile --progress=plain .

DOCKER_REGISTRY := cresendifyqa.azurecr.io/dispatch_api

login-acr:
	az acr login --name cresendifyqa

docker-push-to-registry:
	docker tag dispatch_api:latest ${DOCKER_REGISTRY}/qa/dispatch_api:latest
	docker push ${DOCKER_REGISTRY}/qa/dispatch_api:latest
	docker rmi ${DOCKER_REGISTRY}/qa/dispatch_api:latest

docker-build-and-push-qa: docker-build-qa-amd64 docker-push-to-registry

release-qa-latest:
	ssh dispatch-api-qa 'docker pull cresendifyqa.azurecr.io/dispatch_api/qa/dispatch_api:latest'
	ssh dispatch-api-qa 'docker compose -p dispatch_api -f /home/azureuser/dispatch_api/dispatch_api.docker-compse.yaml down'
	ssh dispatch-api-qa 'docker compose -p dispatch_api -f /home/azureuser/dispatch_api/dispatch_api.docker-compse.yaml up -d api'

restart-qa:
	ssh dispatch-api-qa 'docker compose -p dispatch_api -f /home/azureuser/dispatch_api/dispatch_api.docker-compse.yaml down'
	ssh dispatch-api-qa 'docker compose -p dispatch_api -f /home/azureuser/dispatch_api/dispatch_api.docker-compse.yaml up -d api'

build-and-deploy-qa: docker-build-and-push-qa release-qa-latest api-db-migrate-qa
