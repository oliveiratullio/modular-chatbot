.PHONY: dev build lint format test docker-up docker-down docker-build docker-logs docker-clean

dev:
	pnpm dev

build:
	pnpm build

lint:
	pnpm lint

format:
	pnpm format

test:
	pnpm test

# Docker commands
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-build:
	docker-compose build --no-cache

docker-logs:
	docker-compose logs -f

docker-clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

# Development with Docker
docker-dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Production with Docker
docker-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Kubernetes commands
k8s-deploy:
	cd infra/k8s && ./deploy.sh

k8s-build-images:
	cd infra/k8s && ./build-images.sh

k8s-status:
	kubectl get pods,svc,ing -n app

k8s-logs:
	kubectl logs -f deployment/backend -n app

k8s-clean:
	kubectl delete namespace app
