#!/bin/bash

PORT=5000
LIBRARY=/home/ting/Music

docker run --name pieplayer -d \
    -p $PORT:8000 \
    -v $LIBRARY:/music:ro \
    tingtingths/pypieplayer:$(cat VERSION)
