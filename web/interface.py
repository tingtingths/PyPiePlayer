import binascii
import glob
import inspect
import os
import json

import player.grab_lyrics
from flask import request
from web import app

class WebInterface():
    def __init__(self, lib):
        self.lib = lib
        path = lib.MEDIA_DIR
        suffix = "__init__.py"
        self.artroot = os.path.join(app.static_folder, "tmp", "album_art") + os.path.sep
        self.streamroot = os.path.join(app.static_folder, "tmp", "stream") + os.path.sep

    def api(self):
        cmd = request.args.get("req")

        if cmd == "id":
            id = request.args.get("id")
            tag = self.lib.get_with_id(id).get_tag()
            artist = tag["artist"]
            title = tag["title"]
            return title + " - " + artist, 200

        if cmd == "json":
            return self.lib.get_json(), 200

        if cmd == "cover":
            if not os.path.exists(self.artroot):
                os.makedirs(self.artroot, exist_ok=True)

            id = request.args.get("id")
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
                        print("Failed to get cover for id " + id)
                        return 200, "/res/image/dummy.png", []
                else:
                    return 200, "/res/image/dummy.png", []
            else:
                filename = os.path.basename(art[0])

            return "/tmp/album_art/" + filename, 200

        if cmd == "stream":
            if not os.path.exists(self.streamroot):
                os.makedirs(self.streamroot, exist_ok=True)
            self.limitcache(self.streamroot, 4)

            id = request.args.get("id")

            filename = id
            stream = glob.glob(self.streamroot + filename + "*")
            if len(stream) == 0:
                track = self.lib.get_with_id(id)
                b, type = track.get_bytes()
                open(self.streamroot + filename + "." + type, "wb").write(b)
                filename += "." + type
            else:
                filename = os.path.basename(stream[0])

            return "/tmp/stream/" + filename, 200

        if cmd == "lyrics":
            id = request.args.get("id")
            tag = self.lib.get_with_id(id).get_tag()
            artist = tag["artist"]
            title = tag["title"]
            lines = player.grab_lyrics.grab(artist, title)

            return json.dumps(lines), 200

        if cmd == "cleancache":
            self.lib.reinit()
            return "okay", 200

        return "", 400

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
