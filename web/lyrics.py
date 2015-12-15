from urllib import request


def lyrics(artist, title):
	format = "json"
	lyrics_wiki = "http://lyrics.wikia.com/api.php?action=lyrics&artist=" + artist + "&song=" + title + "&fmt=" + format
	
	r = request.urlopen(lyrics_wiki)
	print(r.status)
	print(r.read().decode("utf-8"))

	return "lyrics"