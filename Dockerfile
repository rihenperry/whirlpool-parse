FROM node:10.16.0 as whirlpool-parse

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
COPY scripts/ scripts/
COPY src/ src/
COPY logs/ logs/

# ENTRYPOINT ["bash ./scripts/wait-for-it.sh"]

