import io
import json
import uuid
import os

import mutagen
from PIL import Image

from player.constant.tag import *


class Track:
    id = ""
    album_artist = None
    artist = None
    album = None
    title = None
    track_num = None
    mimetype_dict = {".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".flac": "audio/flac", ".acc": "audio/acc"}

    def __init__(self, path):
        self.id = uuid.uuid4().hex.replace("-", "")[:12]
        self.path = path
        self.inited = False

    def get_mimetype(self):
        root, ext = os.path.splitext(self.path)
        return self.mimetype_dict[ext]

    def get_tag(self, force_reload=False):
        if not self.inited or force_reload:
            f = mutagen.File(self.path, easy=True)  # guess the filetype and open

            if f:
                try:
                    self.album_artist = f["albumartist"]
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

                if type(self.album_artist) is list:
                    self.album_artist = self.album_artist[0]
                if type(self.artist) is list:
                    self.artist = self.artist[0]
                if type(self.album) is list:
                    self.album = self.album[0]
                if type(self.title) is list:
                    self.title = self.title[0]
                if type(self.track_num) is list:
                    self.track_num = self.track_num[0]

                self.album_artist = self.artist if self.album_artist.strip() == "" else self.album_artist
                self.inited = True

        return {TAG_ID: self.id, TAG_ARTIST: self.artist, TAG_ALBUM: self.album, TAG_TITLE: self.title,
                TAG_TRACK_NUM: self.track_num,
                TAG_ALBUM_ARTIST: self.album_artist}

    def get_file(self):
        return open(self.path, "rb")

    def get_artwork_bytes(self):
        f = mutagen.File(self.path)

        if f:
            try:
                data = io.BytesIO(f["covr"][0])
                img = Image.open(data)
                # resize and convert to jpeg
                img.thumbnail((400, 400), Image.ANTIALIAS)
                formated_b = io.BytesIO()
                img.save(formated_b, format="JPEG")

                return formated_b.getvalue(), "jpg"
            except Exception as e:
                print(e.message)
                return None, "error"

    def to_json(self):
        return json.dumps(self.get_tag())
