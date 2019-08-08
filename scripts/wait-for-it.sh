#!/bin/bash

while ! ((nc -z whirlpool-rmq 5672) && (nc -z whirlpool-mongodb 27017)); do sleep 3; done
echo "node evironment is set to: " $NODE_ENV
npm start
