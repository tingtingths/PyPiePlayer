from urllib import request as req, parse
from bs4 import BeautifulSoup
import json


def grab(artist, title):
    url = "http://lyrics.wikia.com/api.php?"
    param = {"action" : "lyrics", "fmt" : "realjson", "artist" : artist, "song" : title}

    json_str = req.urlopen(url + parse.urlencode(param)).read().decode("utf-8")
    decoded = json.loads(json_str.split(" = ")[-1])
    if decoded["page_id"] != "":
        lyric_url = decoded["url"]
        return parse_lyric_wikia(req.urlopen(lyric_url).read().decode("utf-8"))
    else:
        return None

def parse_lyric_wikia(html):
    soup = BeautifulSoup(html, "html.parser")

    lyricbox = soup.find("div", attrs={"class" : "lyricbox"})
    for script in lyricbox.find_all("script"):
        script.decompose()
    return lyricbox.get_text("\n", strip=True).split("\n")
