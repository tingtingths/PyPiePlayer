import re
import os
from http.server import *
from urllib.parse import urlparse


def buildHandler(filter, workers, webRoot):
    class RequestHandler(BaseHTTPRequestHandler):

        code = 200

        def __init__(self, *args, **kwargs):
            super(RequestHandler, self).__init__(*args, **kwargs)

        def do_GET(self):
            path = self.getPath(self.path)
            query = self.getQuery(self.path)
            print(query)
            headers = self.getHeaderAttributes(self.headers)
            reqContext = RequestContext(self.client_address, headers, self.command, path, query)

            filterResult = self.filter(filter, reqContext)

            if filterResult[0]: # positive result
                # map with resource in webDir
                mapped = False
                if webRoot != None and os.path.exists(webRoot + os.path.sep + path):
                    mapped = True
                    mapResult = self.sendPath(webRoot + path)
                    self.echoResult(mapResult)

                if not mapped:  # resource not found, try worker
                    # look for corresponding worker
                    worker = self.getWorker(path, workers)
                    if worker:
                        result = worker.do_GET(reqContext)  # result - tuple (code, body)
                        self.echoResult(result)
                    else:  # worker not found
                        self.send_error(404)
                        self.send_header('Content-type', 'text/html')
                        self.end_headers()
            else:
                self.echoResult((filterResult[1], filterResult[2], filterResult[3]))

        def do_POST(self):
            path = self.getPath(self.path)
            query = self.getQuery(self.path)
            headers = self.getHeaderAttributes(self.headers)
            reqContext = RequestContext(self.client_address, headers, self.command, path, query)

            filterResult = self.filter(filter, reqContext)

            if filterResult[0]:
                worker = self.getWorker(path, workers)
                if worker:
                    result = worker.dp_POST(reqContext)  # result - tuple (code, body)
                    self.echoResult(result)
                else:
                    self.send_error(404)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
            else:
                self.echoResult((filterResult[1], filterResult[2], filterResult[3]))

        def sendPath(self, path):  # send a file or index directory
            if os.path.isfile(path) and os.path.exists(path):
                return 200, self.readBytes(path), []

            # if directory
            if "index.html" in os.listdir(path):
                return 200, self.readBytes(path + os.path.sep + "index.html"), []
            elif os.path.isdir(path) and os.path.exists(path):
                return 200, self.printDir(path), []

            return 500, "", []


        def echoResult(self, result):  # result - (code, bytes/str, headers)
            # print header
            self.send_response(result[0])
            for header in result[2]:
                self.send_header(header[0], header[1])
            self.end_headers()

            # print content
            bodyType = type(result[1])
            if bodyType is str:
                self.wfile.write(bytes(result[1], "utf-8"))
            if bodyType is bytes or bodyType is bytearray:
                self.wfile.write(result[1])

        def getWorker(self, path, _workers):
            try:
                return [x for x in _workers if re.match("^" + x.path + "(/|$)", path)][0]
            except IndexError:
                return None

        def getPath(self, path):
            return urlparse(path).path

        def getQuery(self, path):
            r = urlparse(path)
            if len(r.query) < 1:
                return None
            return {q.split("=")[0]: q.split("=")[1] if "=" in q else q for q in [x for x in r.query.split("&")]}

        def getHeaderAttributes(self, headers):
            attr = {}

            for header in str(headers).split("\n"):
                try:
                    attr[header.split(":")[0].strip()] = header.split(":")[1].strip()
                except:
                    pass

            return attr

        def readBytes(self, file):
            f = open(file, "rb")

            try:
                data = f.read()
                f.close()

                return data
            except:
                self.handleException()

        def printDir(self, dir):
            s = ""

            for name in os.listdir(dir):
                if name != "__init__.py" and name != "__pycache__":
                    path = dir + os.path.sep + name
                    isD = "d" if os.path.isdir(path) else "f"
                    size = os.path.getsize(path) if isD == "f" else "-"
                    s += isD + " " + name + " " + str(size) + "\n"

            return s

        def filter(self, _filter, reqContext):
            if _filter:
                return _filter.filter(reqContext)
            return True, 200, "", []

        def handleException(self):
            self.send_error(500)
            self.send_header('Content-type', 'text/html')
            self.end_headers()

    return RequestHandler


class RequestContext():
    # clientAddress - (host, port), headers - {'key': 'value', }, method - "", path - "", query - {'key': 'value', }
    def __init__(self, clientAddress, headers, method, path, query):
        self.clientAddress = clientAddress
        self.headers = headers
        self.method = method
        self.path = path
        self.query = query

    def __str__(self):
        return "clientAddr: " + str(self.clientAddress) + "\n, headers: " + str(
            self.headers) + "\n, method: " + self.method + "\n, path: " + self.path + "\n, query: " + str(self.query)
