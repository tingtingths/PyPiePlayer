#!/bin/bash

path="tingtingths/"
name="pypieplayer"
tag="$(cat VERSION)"

echo "Building $path$name:$tag ..."

docker build -t $path$name:$tag .
