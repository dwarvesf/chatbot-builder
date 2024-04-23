install:
	bun install

dev:
	bun dev

db:
	docker-compose -p chatbot_builder -f ./build/local/docker-compose.yml up -d

db-migrate:
	bun drizzle-kit push:pg
