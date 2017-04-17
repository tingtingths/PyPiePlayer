from config import *
from player.library import Library
from web import app
from web.controller import get_controller

suffix = "__init__.py"
lib = Library(library_path)  # scan directory
web = get_controller(lib)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, threaded=True, debug=DEBUG)  # no ssl
    # app.run(host="0.0.0.0", port=PORT, threaded=True, ssl_context=(cert_file, pkey_file), debug=DEBUG)

    # wsgi
    # app.run()
