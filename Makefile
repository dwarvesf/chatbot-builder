install:
	bun install

dev:
	bun dev

local-up: db

db:
	docker-compose -p chatbot_builder -f ./build/local/docker-compose.yml up -d

db-down:
	docker-compose -p chatbot_builder -f ./build/local/docker-compose.yml down

db-down-prune:
	docker-compose -p chatbot_builder -f ./build/local/docker-compose.yml down --volumes

db-migrate:
	bun drizzle-kit push:pg
