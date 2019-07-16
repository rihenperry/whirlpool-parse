FROM node:10.16.0 as whirlpool-parse-base

RUN apt-get update \
  && apt-get install -y --no-install-recommends netcat \
  && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash whirlpool

ARG WH_PARSE_ROOT=/home/whirlpool/whirlpool-parse
WORKDIR $WH_PARSE_ROOT

RUN chown -R whirlpool:whirlpool $WH_PARSE_ROOT

# files necessary to build the project
COPY package.json ./
COPY .babelrc ./
COPY .eslintrc.js ./
COPY .eslintignore ./
COPY package-lock.json ./

RUN npm install --no-audit

COPY config/ config/
COPY src/ src/
COPY logs/ logs/


# docker image for dev target
FROM whirlpool-parse-base as whirlpool-parse-dev

COPY scripts/wait-for-it.sh scripts/wait-for-it.sh
ENTRYPOINT ["bash ./scripts/wait-for-it.sh"]

# docker image for prod target
FROM whirlpool-parse-base as whirlpool-parse-prod

COPY scripts/wait-for-it-prod.sh scripts/wait-for-it-prod.sh
ENTRYPOINT ["bash ./scripts/wait-for-it-prod.sh"]
