#!/bin/bash

LIBRARY=/volume1/music

workdir=/srv/docker/pieplayer

mkdir -p $workdir/sockets \
	$workdir/log

docker run --name pieplayer -d \
    -v $LIBRARY:/music:ro \
	-v $workdir/sockets:/sockets \
	-v $workdir:/log:/log \
    tingtingths/pypieplayer:$(cat VERSION)
