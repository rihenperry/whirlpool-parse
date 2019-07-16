### whirlpool-parse

steps to build and push the service after pulling the repository.

`
docker build --no-cache -t whirlpool-parse-dev:latest --target whirlpool-parse-dev .
`

`
docker tag whirlpool-parse-dev:latest rihbyne/whirlpool-parse-dev:latest
`

`
docker push rihbyne/whirlpool-parse-dev:latest
`

`
docker-compose -f dev-docker-compose.yml build --no-cache whirlpool-parse
`

start the container with build flag in detach mode (will build all the images before starting)

`
docker-compose -f dev-docker-compose.yml up --build -d whirlpool-parse
`

stop the container by removing non-running containers 

`
docker-compose -f dev-docker-compose.yml down --remove-orphans
`

Start with no dependencies
`docker-compose run --no-deps SERVICE COMMAND [ARGS...]`
