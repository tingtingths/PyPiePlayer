import mutagen
from PIL import Image
import io, os


class Track():

	artist = [""]
	album = [""]
	title = [""]
	track_num = [""]

	def __init__(self, path):
		self.path = path

	def get_tag(self):
		f = mutagen.File(self.path, easy=True) # guess the filetype and open
		
		if f:
			try:
				self.artist = f["albumartist"]
			except:
				pass
			try:
				self.album = f["album"]
			except:
				pass
			try:
				self.title = f["title"]
			except:
				pass
			try:
				self.track_num = f["tracknumber"]
			except:
				pass

			if self.artist[0] == "":
				self.artist = f["artist"]

			self.artist = self.artist[0]
			self.album = self.album[0]
			self.title = self.title[0]
			self.track_num = self.track_num[0]

			return {"artist" : self.artist, "album" : self.album, "title" : self.title, "track_num" : self.track_num}

		return None

	def get_bytes(self):
		return open(self.path, "rb").read(), os.path.splitext(self.path)[1].replace(".", "")

	def get_art_bytes(self):
		f = mutagen.File(self.path)

		if f:
			data = f["covr"][0]
			open("in", "wb").write(data)
			
			im = Image.open("in")
			im.save("out.jpg")
			b = open("out.jpg", "rb").read()
			os.remove("in")
			os.remove("out.jpg")
			return b, "jpg"