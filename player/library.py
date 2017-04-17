import json
import os
import time

import pyinotify

from player.constant.tag import *
from player.data.track import Track


class Library:
    file_type = [".m4a", ".mp3", ".flac", ".aac"]

    def __init__(self, library_path):
        self.cache = None
        self.library_json = ""
        self.library_path = os.path.abspath(library_path)
        self.wm = None
        self.notifier = None

        self.setup_library()
        self.setup_watchdog()

    def setup_library(self):
        self.cache = self.scan(self.library_path)
        self._update_json()

    def _update_json(self):
        self.library_json = json.dumps({"cached_time": round(time.time()), "library": self.cache.lib},
                                       default=lambda o: o.get_tag() if type(o) is Track else str(o))

    def setup_watchdog(self):
        self.wm = pyinotify.WatchManager()
        self.notifier = pyinotify.Notifier(self.wm, default_proc_fun=self.watchdog)
        self.wm.add_watch(self.library_path, 768)
        self.notifier.loop()

    def scan(self, path):
        cache = LibraryCache()  # {artist, {album, {track}}}
        print("Scanning " + path)

        for root, dirs, files in os.walk(path):
            for f in files:
                _root, ext = os.path.splitext(f)
                if ext in self.file_type:
                    f = os.path.join(root, f)
                    track = Track(os.path.abspath(f))
                    cache.put_track(track)

        print("Found {0} song".format(cache.get_track_count()))
        return cache

    def get_library_json(self):
        return self.library_json

    def get_track(self, track_id):
        return self.cache.get_track_by_id(track_id)

    def get_artwork_bytes(self, artist, album):
        return self.cache.get_artwork_bytes(artist, album)

    def watchdog(self, event):
        if os.path.splitext(event.name)[1] in self.file_type:
            if event.maskname == "IN_CREATE":
                track = Track(os.path.abspath(event.pathname))
                self.cache.put_track(track)
            if event.maskname == "IN_DELETE":
                self.cache.remove_track(event.pathname)
            self._update_json()


class LibraryCache:
    def __init__(self):
        self.lib = {}  # {artist, {album, {id, track_obj}}}
        self.id_dict = {}  # {id, track_obj}
        self.track_count = 0
        self.art_cache = {}

    def get_track_count(self):
        self.track_count = 0

        for artist, albums in self.lib.items():
            for album, track_ids in albums.items():
                self.track_count += len(track_ids)

        return self.track_count

    def get_artists(self):
        return self.lib.keys()

    def get_artist_albums(self, artist):
        if artist not in self.lib:
            return None
        return self.lib[artist]

    def get_album_tracks(self, artist, album):
        if self.get_artist_albums(artist) is None or album not in self.get_artist_albums(artist):
            return None
        return self.get_artist_albums(artist)[album]

    def get_tracks(self, artist, album, track):
        tracks = []

        if self.get_album_tracks(artist, album) is not None:
            for track_id, track_obj in self.get_album_tracks(artist, album).items():
                if track_obj.get_tag()[TAG_TITLE] == track:
                    tracks.append(track_obj)

        return tracks

    def get_track_by_id(self, track_id):
        if track_id not in self.id_dict:
            return None
        return self.id_dict[track_id]

    def get_artwork_bytes(self, artist, album):
        track = list(self.get_album_tracks(artist, album).values())[0]
        if track.get_tag()[TAG_ID] not in self.art_cache:
            self.art_cache[track.get_tag()[TAG_ID]] = track.get_artwork_bytes()[0]
        return self.art_cache[track.get_tag()[TAG_ID]]

    def _construct_artist(self, artist):
        self.lib[artist] = {}

    def _construct_album(self, artist, album):
        if self.lib[artist] is None:
            self._construct_artist(artist)
        self.lib[artist][album] = {}

    def put_track(self, track_obj):
        artist = track_obj.get_tag()[TAG_ALBUM_ARTIST]
        album = track_obj.get_tag()[TAG_ALBUM]

        if self.get_artist_albums(artist) is None:
            self._construct_artist(artist)
        if self.get_album_tracks(artist, album) is None:
            self._construct_album(artist, album)

        track_id = track_obj.get_tag()[TAG_ID]
        self.get_album_tracks(artist, album)[track_id] = track_obj
        self.id_dict[track_id] = track_obj
        self.track_count += 1

    def remove_track(self, path):
        d_artist = ""
        d_album = ""
        d_id = ""

        for artist, albums in self.lib.items():
            for album, track_ids in albums.items():
                for id, track in track_ids.items():
                    if track.path == path:
                        d_artist = artist
                        d_album = album
                        d_id = id

        print("REMOVE - " + d_id)
        self.lib[d_artist][d_album].pop(d_id)
        if len(self.lib[d_artist][d_album].values()) == 0:
            self.lib[d_artist].pop(d_album)
        if len(self.lib[d_artist].values()) == 0:
            self.lib.pop(d_artist)

        self.track_count -= 1

    def to_json(self):
        return json.dumps(self.lib, default=lambda o: o.get_tag() if type(o) is Track else str(o))
