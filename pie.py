from player.library import Library
from player.track import Track
from web.interface import WebInterface
from web import res
from simplewebframework.server.server import Server
import inspect
import time


if __name__ == "__main__":
	f = open("log", "a")
	f.write("----------------" + time.strftime("%Y-%m-%d %H:%M:%S------------------------") + "\n")
	print("starting PyPiePlayer...")
	f.write("starting PyPiePlayer...\n")
	f.close()
	lib = Library("D:\\Users\\Ting\\Google Drive\\My Stuffs\\Music") # scan directory
	web = WebInterface(lib)
	s = Server(8383)
	s.register(web)
	s.register(inspect.getfile(res))
	s.run()