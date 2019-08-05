install:
	docker-compose -f docker-compose.build.yml run --rm install

quick-up:
	docker-compose -f docker-compose.build.yml run --rm quick-up

dev-build:
	docker build --no-cache -t whirlpool-parse-dev:latest --target whirlpool-parse-dev .

prod-build:
	docker build --no-cache -t whirlpool-parse-prod:latest --target whirlpool-parse-prod .

dev-up:
	docker-compose -f dev-docker-compose.yml up --build -d

prod-up:
	docker-compose -f prod-docker-compose.yml up --build -d

dev-logs:
	docker-compose -f dev-docker-compose.yml logs -f

prod-logs:
	docker-compose -f prod-docker-compose.yml logs -f

push-dev:
	docker push rihbyne/whirlpool-parse-dev:latest

push-prod:
	docker push rihbyne/whirlpool-parse-prod:latest

tag-dev:
	docker tag whirlpool-parse-dev:latest rihbyne/whirlpool-parse-dev:latest

tag-prod:
	docker tag whirlpool-parse-prod:latest rihbyne/whirlpool-parse-prod:latest
