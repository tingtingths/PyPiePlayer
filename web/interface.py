import binascii
import glob
import inspect
import os

import web
import web.lyrics
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
            artist = self.fromHex(req.query["artist"])
            album = self.fromHex(req.query["album"])
            filename = self.toHex(artist + album)
            # see if art exist
            art = glob.glob(self.artroot + filename + "*")
            if len(art) == 0:
                song = self.getsong(artist, album)
                if song is not None:
                    b, type = song.get_art_bytes()
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

        if cmd == "lyrics":
            artist = self.fromHex(req.query["artist"])
            title = self.fromHex(req.query["title"])

            return 200, web.lyrics.lyrics(artist, title), []

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
