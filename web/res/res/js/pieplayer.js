var isArtTop = true; //remember which img element to use, for crossfading artwork
var interval;
var refreshRate = 500; //ms
var lyric = false;
var artworkFormat = ".jpg";
var prevList = [];
var currentSong = {"artist" : null, "album" : null, "title" : null};
var playlist = [];
var shuffle = true;
var vol = 0.8;

//btn name
var playBtn = "playNew.png";
var pauseBtn = "pauseNew.png";
var nextBtn = "next.png";
var prevBtn = "prev.png";

var artists; // library

var previous_selected_artist; //String
var selected_artist; //html element

//howler.js 1
var howler = null;
var howler_state = 0; //0 = stop, 1 = pause, 2 = playing

window.onload = function() {
	document.getElementById("progress").addEventListener('click', function(event) {
		setProgress(event);
	});
	$('#fullpage').fullpage({
		//Navigation
		menu: false,
		navigation: false,
		navigationPosition: 'right',
		slidesNavigation: true,
		slidesNavPosition: 'bottom',

		//Scrolling
		css3: true,
		scrollingSpeed: 500,
		autoScrolling: true,
		scrollBar: false,
		easingcss3: 'cubic-bezier(.35,.55,.55,.9)',
		loopBottom: false,
		loopTop: false,
		loopHorizontal: true,
		continuousVertical: false,
		normalScrollElements: '.list, #lyricbox',
		scrollOverflow: true,
		touchSensitivity: 15,
		normalScrollElementTouchThreshold: 5,

		//Accessibility
		keyboardScrolling: true,
		animateAnchor: true,
		recordHistory: true,

		//Design
		controlArrows: false,
		verticalCentered: false,
		resize : false,
		sectionsColor : ['#ccc', '#fff'],
		paddingTop: '0',
		paddingBottom: '0',
		fixedElements: '#header, .footer',
		responsive: 0,

		//Custom selectors
		sectionSelector: '.section',
		slideSelector: '.slide',

		//events
		onLeave: function(index, nextIndex, direction){},
		afterLoad: function(anchorLink, index){},
		afterRender: function(){},
		afterResize: function(){},
		afterSlideLoad: function(anchorLink, index, slideAnchor, slideIndex){},
		onSlideLeave: function(anchorLink, index, slideIndex, direction){}
	});
	document.getElementById("volumeSlider").value = vol * 100;
	var list_2 = document.getElementById("list_2");
	list_2.width -= 4;
	curVol = document.getElementById("volumeSlider").value;
	getList1();
	setInterval(function() { updatePos() }, refreshRate);
};

function hoverProgressText(ele) {
	document.getElementById("progressText").style.opacity = "1";
	setTimeout(function() {
		document.getElementById("progressText").style.opacity = "0";
	}, 2500);
}

function updatePos() {
	if (howler) {
		var duration = howler.duration();
		var pos = howler.seek();
		if (typeof(pos) == "number") {
			document.getElementById("progress").value = pos;
			document.getElementById("progress").max = duration;
			document.getElementById("progress").innerHTML = pos + "/" + duration;
			var x_pos = window.innerWidth * document.getElementById("progress").position - document.getElementById("progressText").offsetWidth/2;
			document.getElementById("progressText").style.left = x_pos + "px";
			var m = Math.floor(pos / 60);
			var s = Math.floor(pos - m * 60);
			document.getElementById("position").innerHTML = m + ":" + pad(s);
		} 
	}
}

function nextTrack() {
	playNext();
}

function backTrack() {
	var pos = howler.seek();
	
	// prev song
	if (pos <= 3) {
		playlist.unshift(prevList.pop());
		playlist.unshift(prevList.pop());
		shuffle = false;
		playNext();
		shuffle = true;
	} else { // reset song
		var lastSong = prevList.pop();
		playlist.unshift(lastSong);
		shuffle = false;
		playNext();
		shuffle = true;
	}
}

function playPause() {
	console.log("playpause");
	if (howler_state == 2) {
		howler.pause();
	} else if (howler_state == 1 || howler_state == 0) {
		howler.play();
	}
}

function setVolume(vol) {
	howler.volume(vol/100);
}

function toggleShuffle() {
	if (shuffle)
		document.getElementById("shuffleBtn").setAttribute("style", "-webkit-filter: invert(50%)");
	else
		document.getElementById("shuffleBtn").setAttribute("style", "");

	shuffle = !shuffle;
}

function howlerState(state) {
	if (howler_state != state) {
		if (state == 0) {
			howler_state = state;
			document.getElementById("playPauseBtn").src = "./res/image/" + playBtn;
		}
		if (state == 1) {
			howler_state = state;
			document.getElementById("playPauseBtn").src = "./res/image/" + playBtn;
		}
		if (state == 2) {
			howler_state = state;
			document.getElementById("playPauseBtn").src = "./res/image/" + pauseBtn;
		}
	}
}

function notifySongChange() {
	document.getElementById("title").innerHTML = currentSong["title"];
	document.getElementById("artist").innerHTML = currentSong["artist"];
	document.getElementById("album").innerHTML = currentSong["album"];
	document.title = currentSong["title"] + " - " + currentSong["artist"];

	if (lyric)
		getLyrics(currentSong["artist"], currentSong["title"]);
}

function playNext() {
	if (playlist.length > 0) {
		var idx = shuffle ? Math.floor(Math.random() * playlist.length) : 0;
		var song = playlist[idx];
		prevList.push(song);
		if (howler)
			howler.off("end");
		getAudioStream(song[0], song[1], song[2]);
		playlist.splice(idx, 1);
	}
}

function shuffleAll() {
	shuffle = true;
	playlist = [];

	for (artist in artists) {
		if (artist != "#count") {
			for (album in artists[artist]) {
				if (album != "#count") {
					for (i in artists[artist][album]) {
						var title = artists[artist][album][i]
						playlist.push([artist, album, title]);
					}
				}
			}
		}
	}

	howler_state = 2;
	playNext();
}

function playArtist(artist) {
	playlist = [];

	for (album in artists[artist]) {
		if (album != "#count") {
			for (i in artists[artist][album]) {
				var title = artists[artist][album][i]
				playlist.push([artist, album, title]);
			}
		}
	}

	howler_state = 2;
	playNext();
}

function playAlbum(artist, album) {
	playlist = [];

	for (i in artists[artist][album]) {
		var title = artists[artist][album][i]
		playlist.push([artist, album, title]);
	}

	howler_state = 2;
	playNext();
}

function playSingle(artist, album, title) {
	playlist = [];

	playlist.push([artist, album, title]);
	howler_state = 2;
	playNext();
}

function getArtwork(artist, album) { //album title
	var imageUrl = "./tmp/album_art/" + artist.hexEncode() + album.hexEncode() + artworkFormat;

	if (isArtTop) {
		if (document.getElementById("artTop").src.replace(/^.*[\\\/]/, '') == album.hexEncode() + artworkFormat) { //if same
			document.getElementById("artTop").style.opacity = "1";
		} else {
			document.getElementById("artTop").src = imageUrl;
		}
		document.getElementById("artTop").onload = function() { //wait untill the image is loaded
			document.getElementById("artTop").style.opacity = "1";
		};
		isArtTop = false;
	} else {
		if (document.getElementById("artTop").src.replace(/^.*[\\\/]/, '') == album.hexEncode() + artworkFormat) {
			document.getElementById("artTop").style.opacity = "0";
		} else {
			document.getElementById("artBottom").src = imageUrl;
		}
		document.getElementById("artBottom").onload = function() {
			document.getElementById("artTop").style.opacity = "0";
		};
		isArtTop = true;
	}
	
	$.get(imageUrl)
        .fail(function() { //if image not exist in server, fetch again
            var req = new XMLHttpRequest();
            req.onreadystatechange = function() {
                if (req.readyState == 4 && req.status == 200) {
                    var path = req.responseText;
                    if (isArtTop) {
                        document.getElementById("artBottom").src = path;
                    } else {
                        document.getElementById("artTop").src = path;
                    }
                }
            }
            req.open("GET", "api?req=cover&artist=" + artist.hexEncode() + "&album=" + album.hexEncode() + "&now=" + new Date(), true);
            req.send();
    });
}

function getAudioStream(artist, album, title) {
	var req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if (req.readyState == 4 && req.status == 200) {
			var path = req.responseText;
			if (howler)
				vol = howler.volume();

			if (howler != null) {
				howler.off("onend");
				howler.unload();
			}
			howler = new Howl({
				src: [path],
				preload: true,
				usingWebAudio: false,
				mobileAutoEnable: true,
				onend: function() {
					playNext();
				},
				onplay: function() {
					howlerState(2);
				},
				onpause: function() {
					howlerState(1);
				},
				onstop: function() {
					howlerState(0);
				},
				onload: function() {
					if (artist != currentSong["artist"] || album != currentSong["album"]) {
						getArtwork(artist, album);
					}
					currentSong["artist"] = artist;
					currentSong["album"] = album;
					currentSong["title"] = title;
					notifySongChange();
				}
			});
			setVolume(document.getElementById("volumeSlider").value);

			howler.pos(0);
			howler.volume(vol);
			if (howler_state == 2) {
				howler.play();
				document.getElementById("playPauseBtn").src = "./res/image/" + pauseBtn;
			}
		}
	}
	req.open("GET", "api?req=stream&artist=" + artist.hexEncode() + "&album=" + album.hexEncode() + "&title=" + title.hexEncode() + "&now=" + new Date(), true);
	req.send();
}

function getList1() {
	var defer = $.Deferred();
	var req = new XMLHttpRequest();

	req.onreadystatechange = function() {
		if (req.readyState == 4 && req.status == 200) { //XMLHttpRequest 'DONE' and 'SUCCESS'
			var json = req.responseText;
			artists = JSON.parse(json);

			// prepare html elements -------------------------------
			var list = document.getElementById("list_1");
			list.innerHTML = "";
			var shuffle_div = document.createElement("div");
			var shuffle_a = document.createElement("a");
			var shuffle_p = document.createElement("p");
			shuffle_div.id = "shuffle_div";
			shuffle_div.artist = "Shuffle All";
			shuffle_div.onclick = function() {
				if (selected_artist) {
					selected_artist.style.background = "#f6f6f6";
				}
				this.style.background = "#c0dade";
				selected_artist = this;
				getList2("Shuffle All");
			};
			shuffle_a.innerHTML = "Shuffle All";
			shuffle_a.onclick = function() {
				shuffleAll();
			}
			shuffle_p.innerHTML = artists["#count"] + " songs";
			shuffle_p.id = "shuffle_p";

			// append shuffle elements
			list.appendChild(shuffle_div);
			shuffle_div.appendChild(shuffle_a);
			shuffle_div.appendChild(document.createElement("br"));
			shuffle_div.appendChild(shuffle_p);
			// ------------------------------------------------------

			for (artist in artists) {
				if (artist != "#count") {
					(function(artist) {
						var div = document.createElement("div");
						var a = document.createElement("a");
						var p = document.createElement("p");

						div.className = "artists";
						div.onclick = function() {
							if (selected_artist) {
									selected_artist.style.background = "#f6f6f6";
							}
							this.style.background = "#c0dade";
							selected_artist = this;
							getList2(artist);
						};
						a.appendChild(document.createTextNode(artist));
						a.className = "artists_name";
						a.onclick = function() {
							playArtist(artist);
						}
						p.innerHTML = artists[artist]["#count"] + " songs";
						p.className = "artists_detail";

						//q append
						list.appendChild(div);
						div.appendChild(a);
						div.appendChild(document.createElement("br"));
						div.appendChild(p);
					})(artist);
				}
			}
			list_1.style.height = "100%";
		}
	}

	req.open("GET", "api?req=json&now=" + new Date(), true);
	req.send();
}

function getList2(keyword) {
	var selectAll = false;
	var list = document.getElementById("list_2");
	var reqs = [];
	var imgs = [];
	var count = 0;
	var display_albums = {};
	var artist = keyword;

	if (previous_selected_artist != keyword) {
		list.scrollTop = 0;

		previous_selected_artist = keyword;
		list.innerHTML = "";
		if (keyword == "Shuffle All") {
			for (artist in artists) {
				if (artist != "#count") {
					for (album in artists[artist]) {
						if (album != "#count") {
							display_albums[album] = artists[artist][album];
						}
					}
				}
			}
		} else {
			display_albums = artists[keyword];
		}
		
		for (var album in display_albums) {
			if (album != "#count") {
				var artist = findArtist(album);
				(function (count, artist, album) {
					var a;
					var img;
					var div, div_left, div_right;

					reqs[count] = new XMLHttpRequest();

					div = document.createElement("div");
					div.className = "albums";
					div_left = document.createElement("div");
					div_left.className = "albums_left";
					div_right = document.createElement("div");
					div_right.className = "albums_right";
					a = document.createElement("a");
					a.className = "albums_title";
					a.appendChild(document.createTextNode(album));
					a.onclick = function () {
						playAlbum(artist, album);
					}
					imgs[count] = document.createElement("img");

					list.appendChild(div);
					div.appendChild(div_left);
					div.appendChild(div_right);
					div_left.appendChild(imgs[count]);
					div_right.appendChild(a);
					div_right.appendChild(document.createElement("hr"));

					//try to use browser cache for the artwork
					var imageUrl = "./tmp/album_art/" + artist.hexEncode() + album.hexEncode() + artworkFormat;
					imgs[count].src = imageUrl;

					imgs[count].className = "albums_artwork";

					// for each song in album
					for (i in display_albums[album]) {
						(function(i) {
							var track = display_albums[album][i];
							var a = document.createElement("a");
							a.className = "songs_title";
							a.appendChild(document.createTextNode(track));
							a.onclick = function() {
								playSingle(artist, album, track);
							}
							div_right.appendChild(a);
							if (i != display_albums[album].length - 1) {
								div_right.appendChild(document.createElement("br"));
							}
						})(i);
					};

					reqs[count].onreadystatechange = function() {
						if (reqs[count].readyState == 4 && reqs[count].status == 200) {
							var path = reqs[count].responseText;
							imgs[count].src = path;
						}
					}
					$.get(imageUrl)
                        .fail(function() { //if image not exist in server, fetch again
                            var req = new XMLHttpRequest();
                            req.open("GET", "api?req=cover&artist=" + artist.hexEncode() + "&album=" + album.hexEncode() + "&now=" + new Date(), true);
                            req.send();
                    });
				})(count, artist, album);
				count += 1;
			}
		}
		list_2.style.height = "100%";
	}
}

function findArtist(album) {
	for (artist in artists) {
		if (artist != "#count") {
			if (album in artists[artist]) {
				return artist;
			}
		}
	}
	return "";
}

function setProgress(event) {
	var bar = document.getElementById("progress");
	var x = event.pageX - bar.offsetLeft;
	var value = x * bar.max / bar.offsetWidth;

	howler.seek(value);
}

function enableLyric() {
	if (lyric) {
		lyric = false;
		document.getElementById("getLyricBtn").style.color = "white";
		document.getElementById("lyricbox").childNodes[0].style.display = "none";
	} else {
		lyric = true;
		document.getElementById("getLyricBtn").style.color = "rgb(255, 92, 92)";
		//document.getElementById("lyricbox").childNodes[0].style.display = "inline";
		getLyrics(currentSong["artist"], currentSong["title"]);
	}
}

function getLyrics(artist, title) {
	var req = new XMLHttpRequest();

	req.onreadystatechange = function() {
		if (req.readyState == 4 && req.status == 200) {
			var lyrics = req.responseText;
			console.log("---------lyrics");
			console.log(lyrics);
			console.log("---------------");

			document.getElementById("lyricbox").innerHTML = lyrics;
		}
	}

	req.open("GET", "api?req=lyrics&artist=" + artist.hexEncode() + "&title=" + title.hexEncode() + "&now=" + new Date(), true);
	req.send();
}


function pad(num) { //pad number with leading 0
	if (num < 10) {
		return "0"+num;
	} else {
		return num;
	}
}

String.prototype.hexEncode = function(){
    var hex, i;

    var result = "";
    for (i = 0; i < this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += hex.slice(-4);
    }

    return result;
}
