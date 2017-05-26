import io
import os

import flask

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
        prefix = os.path.commonprefix([self.lib.library_path, track.get_path()])
        path = "/pie/stream" + track.get_path()[len(prefix):]

        resp = flask.make_response()
        resp.headers["Content-Type"] = track.get_mimetype()
        resp.headers["X-Accel-Redirect"] = path.encode("utf-8")
        return resp

    def get_track_lyric(self, track_id):
        track = self.lib.get_tracks(track_id)
        if track is None:
            flask.abort(404)
        tag = track.get_tag()
        return json.dumps(grab_lyric(tag[TAG_ARTIST], tag[TAG_TITLE]))
