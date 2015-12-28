import inspect
import os
import time

from log import wlog
from player.library import Library
from simplewebframework.server.server import Server
from web import res
from web.filter import WebFilter
from web.interface import WebInterface

if __name__ == "__main__":
    current_path = os.path.dirname(os.path.abspath(__file__))

    wlog("----------------" + time.strftime("%Y-%m-%d %H:%M:%S------------------------") + "\n")
    wlog("starting PyPiePlayer...\n")

    f = open("log", "a")
    f.write("----------------" + time.strftime("%Y-%m-%d %H:%M:%S------------------------") + "\n")
    print("starting PyPiePlayer...")
    f.write("starting PyPiePlayer...\n")
    f.close()

    lib = Library("path/to/music")  # scan directory
    web = WebInterface(lib)
    s = Server(4343,
               ssl=True,
               cert=current_path + os.path.sep + "web" + os.path.sep + "ssl" + os.path.sep + "cert.pem",
               key=current_path + os.path.sep + "web" + os.path.sep + "ssl" + os.path.sep + "key")
    s.register(web)
    s.register(WebFilter("user", "passwd"))
    s.register(inspect.getfile(res))
    s.run()
