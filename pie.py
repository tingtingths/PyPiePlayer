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
password = "passwd"
music_path = "path/to/music"

if __name__ == "__main__":
    current_path = os.path.dirname(os.path.abspath(__file__))

    #wlog("----------------" + time.strftime("%Y-%m-%d %H:%M:%S------------------------") + "\n")
    #wlog("starting PyPiePlayer...\n")

    lib = Library(music_path)  # scan directory
    web = WebInterface(lib)
    s = Server(4343,
               ssl=True,
               cert=current_path + os.path.sep + "web" + os.path.sep + "ssl" + os.path.sep + "cert.pem",
               key=current_path + os.path.sep + "web" + os.path.sep + "ssl" + os.path.sep + "key")
    s.register(web)
    s.register(WebFilter(username, password))
    s.register(inspect.getfile(res))
    s.run()
