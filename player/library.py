import glob
import inspect
import json
import os

import mutagen

from player.track import Track


class Library():
    media_type = [".m4a", ".mp3", ".flac", ".aac"]
    lib = {}
    count_str = "#count"
    json = ""

    def __init__(self, media_dir):
        self.MEDIA_DIR = media_dir
        open("log", "a").write("scanning...\n")
        print("scanning...")
        if not self.loadlib():
            self.scan(self.MEDIA_DIR)
            if len(self.lib) > 0:
                self.savelib()
        open("log", "a").write("found " + str(self.lib[self.count_str]) + " songs\n")
        print("found " + str(self.lib[self.count_str]) + " songs")

    def loadlib(self):
        de_print = True
        LIB_DIR = os.path.dirname(inspect.getfile(Track)) + os.path.sep
        self.libpath = LIB_DIR + "library"

        if os.path.exists(self.libpath):
            try:
                # read
                j_artist = json.load(open(self.libpath, encoding="utf-8"))
                for artist in j_artist:
                    if artist != self.count_str:
                        for album in j_artist[artist]:
                            if album != self.count_str:
                                for track in j_artist[artist][album]:
                                    self.put_song(artist, album, track[0], 0, Track(track[1]))
            except Exception as e:
                print(e)
                return False
            return True

        return False

    def scan(self, scan_dir):
        if self.json != "":
            self.json == ""

        for root, dirs, files in os.walk(scan_dir):
            for dir in dirs:
                self.scan(dir)
            for file in files:
                tup = self.get_tag(root + os.path.sep + file)
                if tup:
                    tag = tup[0]
                    track = tup[1]
                    self.put_song(tag["artist"], tag["album"]
                                  , tag["title"], tag["track_num"], track)

    def get_tag(self, file):
        track = Track(file)
        tag = track.get_tag()
        if not tag:
            return None
        return tag, track

    def get(self, artist, album=None, title=None):
        if album and title:
            return self.lib[artist][album][title]
        if album:
            return self.lib[artist][album]
        return self.lib[artist]

    def put_song(self, artist, album, title, track_num, track):
        if artist not in self.lib:
            self.lib[artist] = {}
        if album not in self.lib[artist]:
            self.lib[artist][album] = {}
        if title not in self.lib[artist][album]:
            self.lib[artist][album][title] = None

        self.lib[artist][album][title] = track

        if self.count_str not in self.lib:
            self.lib[self.count_str] = 0
        if self.count_str not in self.lib[artist]:
            self.lib[artist][self.count_str] = 0
        if self.count_str not in self.lib[artist][album]:
            self.lib[artist][album][self.count_str] = 0

        self.lib[artist][album][self.count_str] += 1
        self.lib[artist][self.count_str] += 1
        self.lib[self.count_str] += 1

    def get_json(self, toFile=False):
        if self.json == "" or toFile:
            sorted_artist = sorted(self.lib)
            s = "{"

            s += "\"#count\":\"" + str(self.lib[self.count_str]) + "\","
            for artist in sorted_artist:
                if artist != self.count_str:
                    s += "\"" + artist + "\": {"
                    s += "\"#count\":\"" + str(self.lib[artist][self.count_str]) + "\","
                    for album in self.lib[artist]:
                        if album != self.count_str:
                            s += "\"" + album + "\": ["
                            for title in self.lib[artist][album]:
                                if title != self.count_str:
                                    if toFile:
                                        s += "[\"" + title + "\",\"" + self.lib[artist][album][title].path.replace("\\",
                                                                                                                   "/") + "\"],"
                                    else:
                                        s += "\"" + title + "\","
                            s = s.rstrip(",")
                            s += "],"  # album
                    s = s.rstrip(",")
                    s += "},"  # artist
            s = s.rstrip(",")
            s += "}"
            if toFile:
                return s
            else:
                self.json = s

        return self.json

    def savelib(self):
        open(self.libpath, "w", encoding="utf-8").write(self.get_json(toFile=True))
