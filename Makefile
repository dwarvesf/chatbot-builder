install:
	bun install

.PHONY: build dev local-up db db-down db-down-prune db-migrate db-seed
build:
	bun run build

dev:
	bun dev

local-up: db

db:
	docker-compose -p chatbot_builder -f ./build/local/docker-compose.yml up -d
	bun src/migration/create-extension.ts

db-down:
	docker-compose -p chatbot_builder -f ./build/local/docker-compose.yml down

db-down-prune:
	docker-compose -p chatbot_builder -f ./build/local/docker-compose.yml down --volumes

db-migrate:
	bun drizzle-kit push:pg

db-seed:
	bun src/server/db/migration/seed.ts

lint-staged:
	bun lint-staged
