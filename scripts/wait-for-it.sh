#!/bin/bash
while ! nc -z whirlpool-rmq 5672; do sleep 3; done
npm start
