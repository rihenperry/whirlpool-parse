#!/bin/bash

while ! ((nc -z whirlpool-rmq 5672) && (nc -z whirlpool-mongodb 27017)); do sleep 3; done
npm start
