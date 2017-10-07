## PyPiePlayer in container
This directory contains scripts to run the player in container.

### Build
Before you build the image, you should modify the files in conf/ accordingly.
```sh
./build.sh
```

### Run
```sh
./run.sh
```
then, modify the nginx config to relay request to the uwsgi socket.