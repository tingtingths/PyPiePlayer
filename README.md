# PyPiePlayer
A web-based music player written in Python and Javascript.

## Requirements
    see requirements.txt

## Run
Modify settings in config.py, then

    python pie.py

## Screenshot
![alt text](screenshot.png "Screenshot")

## Known issue(s)

**Seeking will not function with *Google Chrome*, when deployed with flask's development server.**

Serve the audio with a proper web server with WSGI support, e.g. nginx.  
Sample config for nginx (assume the player was deployed at *somedomain.com/pie*)

    location /pie {
        include uwsgi_params;
        uwsgi_pass unix:<path_to_sock_file>;
    }
    
    # delegate stream response to nginx
    location /pie/stream {
            internal;
            alias <library_path>;
    }
