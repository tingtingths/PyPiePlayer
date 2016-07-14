import io
import os
import uuid

import mutagen
from PIL import Image


class Track():
    albumartist = [""]
    artist = [""]
    album = [""]
    title = [""]
    track_num = [""]

    def __init__(self, path):
        self.path = path

    def get_tag(self):
        f = mutagen.File(self.path, easy=True)  # guess the filetype and open

        if f:
            try:
                self.albumartist = f["albumartist"]
            except:
                pass
            try:
                self.artist = f["artist"]
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

            if type(self.albumartist) is list:
                self.albumartist = self.albumartist[0]
            if type(self.artist) is list:
                self.artist = self.artist[0]
            if type(self.album) is list:
                self.album = self.album[0]
            if type(self.title) is list:
                self.title = self.title[0]
            if type(self.track_num) is list:
                self.track_num = self.track_num[0]

            self.albumartist = self.artist if self.albumartist.strip() == "" else self.albumartist

            return {"artist": self.artist, "album": self.album, "title": self.title, "track_num": self.track_num, "albumartist" : self.albumartist}

        return None

    def get_bytes(self):
        return open(self.path, "rb").read(), os.path.splitext(self.path)[1].replace(".", "")

    def get_art_bytes(self):
        f = mutagen.File(self.path)

        if f:
            try:
                temp_out = str(uuid.uuid4()) + ".jpg"
                temp_in = str(uuid.uuid4())

                data = f["covr"][0]
                open(temp_in, "wb").write(data)

                im = Image.open(temp_in)
                im.save(temp_out)
                b = open(temp_out, "rb").read()
                os.remove(temp_in)
                os.remove(temp_out)
                return b, "jpg"
            except Exception as e:
                return None, "error"
