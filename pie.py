import inspect
import os
import time

from log import wlog
from player.library import Library
from simplewebframework.server.server import Server
from web import res
from web.filter import WebFilter
from web.interface import WebInterface

username = "user"
# sha-256, default: password
password_hash = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
music_path = "path/to/music"

if __name__ == "__main__":
    current_path = os.path.dirname(os.path.abspath(__file__))

    suffix = "__init__.py"
    lib = Library(music_path, inspect.getfile(res)[:len(inspect.getfile(res)) - len(suffix)] + "tmp")  # scan directory
    web = WebInterface(lib)
    s = Server(4343,
               ssl=True,
               cert=current_path + os.path.sep + "web" + os.path.sep + "ssl" + os.path.sep + "cert.pem",
               key=current_path + os.path.sep + "web" + os.path.sep + "ssl" + os.path.sep + "key")
    s.register(web)
    s.register(WebFilter(username, password_hash))
    s.register(inspect.getfile(res))
    s.run()
