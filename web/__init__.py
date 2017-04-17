from flask import Flask

app = Flask(__name__)

import web.controller
import web.filter
