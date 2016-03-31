import binascii
import glob
import inspect
import os
import json

import web
import player.grab_lyrics
from player.library import Library
from player.track import Track
from simplewebframework.framework.worker import RequestWorker


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
            if not os.path.exists(self.artroot):
                os.makedirs(self.artroot, exist_ok=True)

            id = req.query["id"]
            filename = id
            # see if art exist
            art = glob.glob(self.artroot + filename + ".jpg")
            if len(art) == 0:
                track = self.lib.get_with_id(id)
                if track is not None:
                    b, type = track.get_art_bytes()
                    if b is not None:
                        open(self.artroot + filename + "." + type, "wb").write(b)
                        filename += "." + type
                    else:
                        return 200, "/res/image/dummy.png", []
                else:
                    return 200, "/res/image/dummy.png", []
            else:
                filename = os.path.basename(art[0])

            return 200, "/tmp/album_art/" + filename, []

        if cmd == "stream":
            if not os.path.exists(self.streamroot):
                os.makedirs(self.streamroot, exist_ok=True)
            self.limitcache(self.streamroot, 4)

            id = req.query["id"]

            filename = id
            stream = glob.glob(self.streamroot + filename + "*")
            if len(stream) == 0:
                track = self.lib.get_with_id(id)
                b, type = track.get_bytes()
                open(self.streamroot + filename + "." + type, "wb").write(b)
                filename += "." + type
            else:
                filename = os.path.basename(stream[0])

            return 200, "/tmp/stream/" + filename, []

        if cmd == "lyrics":
            id = req.query["id"]
            tag = self.lib.get_with_id(id).get_tag()
            artist = tag["artist"]
            title = tag["title"]
            lines = player.grab_lyrics.grab(artist, title)

            return 200, json.dumps(lines), []

        if cmd == "cleancache":
            libfile = os.path.dirname(inspect.getfile(Library)) + os.path.sep + "library"

            if os.path.exists(libfile):
                os.remove(libfile)
            self.lib.lib = {}
            self.lib.scan(self.lib.MEDIA_DIR)
            self.lib.savelib()

            return 200, "okay", []

        return 400, "", []

    def toHex(self, s):
        return binascii.hexlify(str.encode(s)).decode("utf-8")

    def fromHex(self, hexS):
        return binascii.unhexlify(hexS).decode("ISO-8859-1")

    def limitcache(self, path, maxitems=0):
        files = [f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]
        tokeep = []

        for f in files:
            tokeep.append((f, os.stat(os.path.join(path, f)).st_atime))

        tokeep = sorted(tokeep, key=lambda tup: tup[1], reverse=True)
        for fname, time in tokeep[maxitems - 1:]:
            os.remove(os.path.join(path, fname))
