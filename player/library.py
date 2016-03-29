import glob
import inspect
import json
import os
from collections import namedtuple

import mutagen

from player.track import Track


class Library():
    media_type = [".m4a", ".mp3", ".flac", ".aac"]
    lib = {}
    song_count = 0
    count_str = "#count"
    json = ""

    Song = namedtuple("Song", ["id", "track_obj"])

    def __init__(self, media_dir):
        self.MEDIA_DIR = media_dir
        open("log", "a").write("scanning...\n")
        if not self.loadlib():
            self.scan(self.MEDIA_DIR)
            if len(self.lib) > 0:
                self.savelib()
                print("found " + str(self.lib[self.count_str]) + " songs")
            else:
                print("found 0 song")

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
        print("scanning...")
        self.json = ""

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
        if album is not None and title is not None:
            return self.lib[artist][album][title].track_obj
        if album is not None:
            return self.lib[artist][album]
        return self.lib[artist]

    def get_with_id(self, id):
        for artist in self.lib:
            if artist != self.count_str:
                for album in self.lib[artist]:
                    if album != self.count_str:
                        for title in self.lib[artist][album]:
                            if title != self.count_str:
                                song_id = str(self.lib[artist][album][title].id)
                                if song_id == id:
                                    return self.lib[artist][album][title].track_obj
        return None


    def put_song(self, artist, album, title, track_num, track):
        if artist not in self.lib:
            self.lib[artist] = {}
        if album not in self.lib[artist]:
            self.lib[artist][album] = {}
        if title not in self.lib[artist][album]:
            self.lib[artist][album][title] = None

        self.lib[artist][album][title] = self.Song(self.song_count, track)
        self.song_count += 1

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

            s += "\"" + self.count_str + "\":\"" + str(self.lib[self.count_str]) + "\","
            for artist in sorted_artist:
                if artist != self.count_str:
                    s += "\"" + artist + "\": {"
                    s += "\"" + self.count_str + "\":\"" + str(self.lib[artist][self.count_str]) + "\","
                    for album in self.lib[artist]:
                        if album != self.count_str:
                            s += "\"" + album + "\": ["
                            for title in self.lib[artist][album]:
                                if title != self.count_str:
                                    id = str(self.lib[artist][album][title].id)
                                    if toFile:
                                        track = self.lib[artist][album][title].track_obj
                                        s += "[\"" + title + "\",\"" + track.path.replace("\\", "/") + "\"],"
                                    else:
                                        s += "{\"title\":\"" + title + "\", \"id\":\"" + id + "\"},"
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
