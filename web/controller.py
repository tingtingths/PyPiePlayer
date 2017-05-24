import io

import flask
import base64

from web import app
from player.grab_lyrics import *
from player.constant.tag import *


def get_controller(lib):
    CONTROLLER = PlayerController(lib)

    app.add_url_rule("/test", view_func=CONTROLLER.test, methods=["GET"])
    app.add_url_rule("/library", view_func=CONTROLLER.get_library, methods=["GET"])
    app.add_url_rule("/<track_id>/artwork", view_func=CONTROLLER.get_art_bytes, methods=["GET"])
    app.add_url_rule("/song/<track_id>/stream", view_func=CONTROLLER.get_track_bytes, methods=["GET"])
    app.add_url_rule("/song/<track_id>/lyrics", view_func=CONTROLLER.get_track_lyric, methods=["GET"])

    return CONTROLLER


class PlayerController:
    def __init__(self, lib):
        self.lib = lib

    # --------------------------- APIs

    def test(self):
        print(self.lib)
        return "test"

    def get_library(self):
        return self.lib.get_library_json()

    def get_art_bytes(self, track_id):
        artwork = io.BytesIO(self.lib.get_artwork_bytes_with_id(track_id))
        return flask.send_file(artwork, mimetype="image/jpeg")

    def get_track_bytes(self, track_id):
        track = self.lib.get_track(track_id)
        if track is None:
            flask.abort(404)
        return flask.send_file(track.get_file(), mimetype=track.get_mimetype())

    def get_track_lyric(self, track_id):
        track = self.lib.get_tracks(track_id)
        if track is None:
            flask.abort(404)
        tag = track.get_tag()
        return json.dumps(grab_lyric(tag[TAG_ARTIST], tag[TAG_TITLE]))