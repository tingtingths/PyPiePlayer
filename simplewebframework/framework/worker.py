class RequestWorker():
    """
    This is an abstract class defining the worker for http request
    """

    def __init__(self, path):
        self.path = path

    def do_GET(self):
        pass

    def do_POST(self):
        pass
