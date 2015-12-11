from simplewebframework.framework.worker import RequestWorker
from player.library import Library
from player.track import Track
import urllib
import hashlib
import web
import inspect
import os
import glob
import binascii


class WebInterface(RequestWorker):

	def __init__(self, lib):
		self.lib = lib
		super(WebInterface, self).__init__("/api")
		path = inspect.getfile(web)
		suffix = "__init__.py"
		if path.endswith(suffix):
			path = path[:len(path) - len(suffix)]
			if os.path.isdir(path) and os.path.exists(path):
				self.webroot = path + "res" + os.path.sep
				self.artroot = self.webroot + "tmp" + os.path.sep + "album_art" + os.path.sep
				self.streamroot = self.webroot + "tmp" + os.path.sep + "stream" + os.path.sep

	def do_GET(self, req):  # req - (clientAddress, headers, method, path, query)

		cmd = req.query["req"]

		if cmd == "json":
			return 200, self.lib.get_json(), [("Content-type", "text/plain-text")]
		if cmd == "cover":
			artist = self.fromHex(req.query["artist"])
			album = self.fromHex(req.query["album"])
			filename = self.toHex(artist + album)
			# see if art exist
			art = glob.glob(self.artroot + filename + "*")
			if len(art) == 0:
				b, type = self.getsong(artist, album).get_art_bytes()
				open(self.artroot + filename + "." + type, "wb").write(b)
				filename += "." + type
			else:
				filename = os.path.basename(art[0])

			return 200, "/tmp/album_art/" + filename, []
		if cmd == "stream":
			self.limitcache(self.streamroot, 4)
			artist = self.fromHex(req.query["artist"])
			album = self.fromHex(req.query["album"])
			title = self.fromHex(req.query["title"])
			filename = self.toHex(album + title)

			stream = glob.glob(self.streamroot + filename + "*")
			if len(stream) == 0:
				b, type = self.lib.get(artist, album, title).get_bytes()
				open(self.streamroot + filename + "." + type, "wb").write(b)
				filename += "." + type
			else:
				filename = os.path.basename(stream[0])

			return 200, "/tmp/stream/" + filename, []

		return 401, "", []

	def toHex(self, s):
		return binascii.hexlify(str.encode(s)).decode("utf-8")

	def fromHex(self, hexS):
		return binascii.unhexlify(hexS).decode("ISO-8859-1")

	def getsong(self, artist, album):
		for song in list(self.lib.get(artist, album).values()):
			if type(song) is Track:
				return song

	def limitcache(self, path, maxitems=0):
		files = [f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]
		tokeep = []

		for f in files:
			tokeep.append((f, os.stat(os.path.join(path, f)).st_atime))

		tokeep = sorted(tokeep, key=lambda tup: tup[1], reverse=True)
		for fname, time in tokeep[maxitems - 1:]:
			os.remove(os.path.join(path, fname))