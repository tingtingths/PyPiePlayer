import inspect
import os

from simplewebframework.framework.filter import RequestFilter
from simplewebframework.framework.handler import *
from simplewebframework.framework.worker import RequestWorker

from socketserver import ThreadingMixIn
import threading


class Server():
    workers = []
    reqFilter = None
    webRoot = None
    server = None
    handler = None
    port = -1

    def __init__(self, port, ssl=False, cert=None, key=None):
        self.server = HTTPServer
        self.port = port
        self.ssl = ssl
        self.cert = cert
        self.key = key

    def register(self, handler):
        if isinstance(handler, RequestWorker):  # worker
            self.workers.append(handler)

        if isinstance(handler, RequestFilter):  # filter
            self.reqFilter = handler

        if isinstance(handler, str):  # webDir
            # process web dir
            suffix = "__init__.py"
            if handler.endswith(suffix):
                handler = handler[:len(handler) - len(suffix)]
            if os.path.isdir(handler) and os.path.exists(handler):
                self.webRoot = handler

    def run(self):
        address = ("", self.port)
        self.handler = buildHandler(self.reqFilter, self.workers, self.webRoot)
        httpd = ThreadingServer(address, self.handler)
        if self.ssl:
            import ssl
            httpd.socket = ssl.wrap_socket(httpd.socket, certfile=self.cert, keyfile=self.key, server_side=True)
        print("Server running @ " + str(self.port) + "...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            httpd.socket.close()

class ThreadingServer(ThreadingMixIn, HTTPServer):
    """Forked threading server"""
