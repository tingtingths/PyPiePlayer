from simplewebframework.framework.handler import *
from simplewebframework.framework.worker import RequestWorker
from simplewebframework.framework.filter import RequestFilter
from simplewebframework.sampleApp import web
from simplewebframework.sampleApp.hello import Hello
from simplewebframework.sampleApp.hello_filter import HelloFilter
import inspect
import os


class Server():

    workers = []
    reqFilter = None
    webRoot = None
    server = None
    handler = None
    port = -1

    def __init__(self, port):
        self.server = HTTPServer
        self.port = port

    def register(self, handler):
        if isinstance(handler, RequestWorker): # worker
            self.workers.append(handler)

        if isinstance(handler, RequestFilter): # filter
            self.reqFilter = handler

        if isinstance(handler, str): # webDir
            # process web dir
            suffix = "__init__.py"
            if handler.endswith(suffix):
                handler = handler[:len(handler) - len(suffix)]
                if os.path.isdir(handler) and os.path.exists(handler):
                    self.webRoot = handler

    def run(self):
        address = ("", self.port)
        self.handler = buildHandler(self.reqFilter, self.workers, self.webRoot)
        httpd = self.server(address, self.handler)
        print("Server running @ " + str(self.port) + "...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            httpd.socket.close()

# sampleApp
if __name__ == "__main__":
    s = Server(8282)
    s.register(inspect.getfile(web))
    s.register(HelloFilter())
    s.register(Hello()) # register a worker here
    s.run()
