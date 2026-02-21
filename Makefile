.PHONY: install lint test build dev start prisma-generate prisma-migrate-dev prisma-migrate-deploy prisma-reset deploy

install:
	pnpm install

lint:
	pnpm run lint

test:
	pnpm run test

build:
	pnpm run build

dev:
	pnpm run start:dev

start:
	pnpm run start

prisma-generate:
	pnpm prisma generate

prisma-migrate-dev:
	pnpm prisma migrate dev

prisma-migrate-deploy:
	pnpm prisma migrate deploy

prisma-reset:
	pnpm prisma migrate reset

deploy: build
	./scripts/deploy.sh
