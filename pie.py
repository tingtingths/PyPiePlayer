from player.library import Library
from player.track import Track
from web.interface import WebInterface
from web.filter import WebFilter
from web import res
from simplewebframework.server.server import Server
import inspect
import time
from log import wlog


if __name__ == "__main__":
	wlog("----------------" + time.strftime("%Y-%m-%d %H:%M:%S------------------------") + "\n")
	wlog("starting PyPiePlayer...\n")
	
	lib = Library("D:\\Users\\Ting\\Google Drive\\My Stuffs\\Music") # scan directory
	web = WebInterface(lib)
	s = Server(8383)
	s.register(web)
	s.register(WebFilter("username", "password"))
	s.register(inspect.getfile(res))
	s.run()