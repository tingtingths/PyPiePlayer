import inspect
import os
import time

from player.library import Library
from web.filter import auth_deco
from web.interface import WebInterface
from web import app

from flask import send_from_directory

# configure here
username = "user"
password_hash = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8" # sha-256, default: password
cert_file = ""
pkey_file = ""
music_path = ""
PORT = 4343
DEBUG = False


if __name__ == "__main__":
    suffix = "__init__.py"
    lib = Library(music_path, "web/static/res/tmp")  # scan directory
    web = WebInterface(lib)

    @app.route("/api")
    @auth_deco(username, password_hash)
    def api():
        return web.api()

    # static files ----------------------------
    @app.route("/")
    @auth_deco(username, password_hash)
    def index():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/<path:name>")
    @auth_deco(username, password_hash)
    def server_static(name):
        return send_from_directory(app.static_folder, name)
    # -----------------------------------------

    #app.run(host="0.0.0.0", port=PORT, threaded=True, debug=DEBUG) # no ssl
    app.run(host="0.0.0.0", port=PORT, threaded=True, ssl_context=(cert_file, pkey_file), debug=DEBUG)
