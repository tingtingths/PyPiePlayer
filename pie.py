from player.library import Library
from player.track import Track
from web.interface import WebInterface
from web.filter import WebFilter
from web import res
from simplewebframework.server.server import Server
from log import wlog
import inspect
import time
import os


if __name__ == "__main__":
	current_path = os.path.dirname(os.path.abspath(__file__))

	wlog("----------------" + time.strftime("%Y-%m-%d %H:%M:%S------------------------") + "\n")
	wlog("starting PyPiePlayer...\n")
	
	f = open("log", "a")
	f.write("----------------" + time.strftime("%Y-%m-%d %H:%M:%S------------------------") + "\n")
	print("starting PyPiePlayer...")
	f.write("starting PyPiePlayer...\n")
	f.close()

	lib = Library("path\to\music") # scan directory
	web = WebInterface(lib)
	s = Server(4343,
		ssl=True,
		cert=current_path + os.path.sep + "web" + os.path.sep + "ssl" + os.path.sep + "cert.pem",
		key=current_path + os.path.sep + "web" + os.path.sep + "ssl" + os.path.sep + "key")
	s.register(web)
	s.register(WebFilter("username", "password"))
	s.register(inspect.getfile(res))
	s.run()