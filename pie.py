import inspect
import os
import time

from player.library import Library
from web.filter import auth_deco
from web.interface import WebInterface
from web import app
from config import *

from flask import send_from_directory

suffix = "__init__.py"
lib = Library(music_path, "web/static/res/tmp")  # scan directory
web = WebInterface(lib)

@app.route("/api")
@auth_deco(users)
def api():
    return web.api()

# static files ----------------------------
@app.route("/")
@auth_deco(users)
def index():
    return send_from_directory(app.static_folder, "index.html")

"""
@app.route("/<path:name>")
@auth_deco(users)
def server_static(name):
    return send_from_directory(app.static_folder, name)
"""

if __name__ == "__main__":
    #app.run(host="0.0.0.0", port=PORT, threaded=True, debug=DEBUG) # no ssl
    #app.run(host="0.0.0.0", port=PORT, threaded=True, ssl_context=(cert_file, pkey_file), debug=DEBUG)

    # wsgi
    app.run()
