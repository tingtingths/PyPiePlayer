var library; // {artist, {album, {id, track}}}
var tracks = {};
var songCount = 0;
var cacheTime;
var cacheTimeAgo;
var shuffle = true;
var isArtTop = true;
var lyric = false;

var selectedArtistDOM;
var playlistItr;
var playlist = [];

//btn name
var playBtn = "playNew.png";
var pauseBtn = "pauseNew.png";
var nextBtn = "next.png";
var prevBtn = "prev.png";

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

const SHUFFLE_ALL_ARTIST = "shuffle_all";

var isLyricOn = false;
var isArtTop = false;

var player;
var playerStatus = 1;
var State = {
    PLAYING: 0,
    PAUSE: 1
};

window.onload = function() {
    init();

    player.onended = function() {
        control.next(true);
    };
    player.onpause = function() {
        document.getElementById("playPauseBtn").src = "./res/image/" + playBtn;
    };
    player.onplay = function() {
        document.getElementById("playPauseBtn").src = "./res/image/" + pauseBtn;
    };

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

    document.getElementById("volumeSlider").value = 100;
    var list_2 = document.getElementById("list_2");
    list_2.width -= 4;
    setVolume(document.getElementById("volumeSlider").value);

    setInterval(function() { updateProgressBar() }, 200);

    changeBkg();
    setInterval(function() {
        changeBkg();
    }, bkg_refresh_rate); //change bkg for every bkg_refresh_rate

    // set update cache time value
    setInterval(function () {
        cacheTimeAgo = timeAgo(cacheTime);
        document.getElementById("cached").innerHTML = "Cached " + cacheTimeAgo;
    }, 5000);
};

// key listening
window.onkeyup = function(e) {
    var playPauseKeys = [32, 75, 179]; // space, media key
    var nextSongKeys = [76, 176]; // L, media key
    var perviousSongKeys = [74, 177];

    if (playPauseKeys.includes(e.keyCode)) // whitespace or media play/pause
        control.playPause();
    if (perviousSongKeys.includes(e.keyCode)) // media back
        control.back();
    if (nextSongKeys.includes(e.keyCode)) // media next
        control.next();
};

var player;
var control = {
    next: function (play) {
        if (!playlistItr.hasNext())
            return null;
        if (typeof play === "undefined" && !player.paused)
            play = true;

        setCurrentTrack(playlistItr.next().value);
        if (play)
            player.play();
    },
    back: function (play) {
        if (!playlistItr.hasPervious())
            return null;
        if (typeof play === "undefined" && !player.paused)
            play = true;

        setCurrentTrack(playlistItr.back().value);
        if (play)
            player.play();
    },
    playPause: function () {
        if (player.paused) {
            player.play();
            if (playlist.length == 0)
                buildPlaylistAndPlay(); // shuffle all
        } else
            player.pause();
    }
}

function setCurrentTrack(track) {
    var imageUrl = track.id + "/artwork";
    if (isArtTop) {
        if (document.getElementById("artTop").src == imageUrl) { //if same
            document.getElementById("artTop").style.opacity = "1";
        } else {
            document.getElementById("artTop").src = imageUrl;
        }
        document.getElementById("artTop").onload = function() { //wait untill the image is loaded
            document.getElementById("artTop").style.opacity = "1";
        };
        isArtTop = false;
    } else {
        if (document.getElementById("artTop").src == imageUrl) {
            document.getElementById("artTop").style.opacity = "0";
        } else {
            document.getElementById("artBottom").src = imageUrl;
        }
        document.getElementById("artBottom").onload = function() {
            document.getElementById("artTop").style.opacity = "0";
        };
        isArtTop = true;
    }

    document.getElementById("title").innerHTML = track.title;
    document.getElementById("artist").innerHTML = track.artist;
    document.getElementById("album").innerHTML = track.album;
    document.title = track.title + " - " + track.artist;

    if (lyric)
        getLyrics(track);

        player.src = "song/" + track.id + "/stream";
    player.load();

}

function setProgress() {
    var bar = document.getElementById("progress");
    var x = event.pageX - bar.offsetLeft;
    var value = parseInt(x * bar.max / bar.offsetWidth);

    player.currentTime = value;
}

function updateProgressBar() {
    if (player) {
        var duration = player.duration;
        if (isNaN(duration)) duration = 0;
        var pos = player.currentTime;
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

function setVolume(vol) {
    player.volume = vol/100;
    document.getElementById("volumeSlider").value = vol;
}

function setPlayerArtwork(src) { //album title
    if (isArtTop) {
        document.getElementById("artTop").src = src;
        document.getElementById("artTop").onload = function() { //wait untill the image is loaded
            document.getElementById("artTop").style.opacity = "1";
        };
        isArtTop = false;
    } else {
        document.getElementById("artBottom").src = src;
        document.getElementById("artBottom").onload = function() {
            document.getElementById("artTop").style.opacity = "0";
        };
        isArtTop = true;
    }
}

function enableLyrics() {
    if (lyric) {
        lyric = false;
        document.getElementById("getLyricBtn").style.color = "white";
        document.getElementById("lyricbox").style.display = "none";
    } else {
        lyric = true;
        document.getElementById("getLyricBtn").style.color = "rgb(255, 92, 92)";
        document.getElementById("lyricbox").style.display = "block";
        getLyrics(playlistItr.current().value);
    }
}

function init() {
    var library_json = "";
    player = document.getElementById("player");

    player.onended = function() {
        nextTrack();
    };
    player.onpause = function() {
        playerStatus = State.PAUSE;
        document.getElementById("playPauseBtn").src = "./res/image/playNew.png";
    };
    player.onplay = function() {
        playerStatus = State.PLAYING;
        document.getElementById("playPauseBtn").src = "./res/image/pauseNew.png";
    };

    setVolume(100);

    ajax("GET", "library", true, function(req) {
        if (req.readyState === 4 && req.status === 200) {
            library_json = req.responseText;
            setupLibrary(library_json);
            constructArtistList();

            document.getElementById("list_1").style.height = "100%";
            document.getElementById("list_2").style.height = "100%";
        }
    });
}

function hoverProgressText(ele) {
    document.getElementById("progressText").style.opacity = "1";
    setTimeout(function() {
        document.getElementById("progressText").style.opacity = "0";
    }, 2500);
}

function setupLibrary(json) {
    var jObj = JSON.parse(json);

    cacheTime = jObj["cached_time"];
    cacheTimeAgo = timeAgo(cacheTime);
    document.getElementById("cached").innerHTML = "Cached " + cacheTimeAgo;

    library = jObj["library"];

    // count songs
    for (var artist in library) {
        for (var album in library[artist]) {
            songCount += getAlbumTrackIds(artist, album).length;
            for (var id in library[artist][album]) {
                tracks[id] = library[artist][album][id];
            }
        }
    }
}

function buildPlaylistAndPlay(artist, album, track_id) {
    playlist = [];

    if (track_id) { // one song only
        playlist.push(getTrack(track_id));
    } else if (album) { // one album only
        var itr = iterator(getAlbumTrackIds(artist, album));
        while (itr.hasNext()) {
            var id = itr.next().value;
            playlist.push(getTrack(id));
        }
    } else if (artist) { // one artist only
        var itr = iterator(getArtistTracksIds(artist));
        while (itr.hasNext()) {
            var id = itr.next().value;
            playlist.push(getTrack(id));
        }
    } else { // shuffle
        playlist = shuffleArray(Object.values(tracks));
    }

    if (shuffle)
        playlist = shuffleArray(playlist);

    playlistItr = pointer(playlist);
    playlistItr.idx(-1);
    control.next(true);
}

function constructArtistList() {
    var artistList = document.getElementById("list_1");

    artistList.appendChild(buildShuffleListItem());

    var artistsItr = sortArtistAndGetItr(library);
    while (artistsItr.hasNext()) {
        var artist = artistsItr.next().value;
        var artistSongCount = 0;
        var albums = library[artist];
        for (var album in albums) {
            artistSongCount += Object.keys(library[artist][album]).length;
        }
        artistList.appendChild(buildArtistListItem(artist, artistSongCount));
    }

    artistList.style.height = "100%";
}

function constructAlbumList(artist) {
    if (selectedArtistDOM !== artist) {
        var albumList = document.getElementById("list_2");
        nodeCleanChild(albumList);
        var artistAlbums = {};

        if (artist === SHUFFLE_ALL_ARTIST) {
            var artistsItr = sortArtistAndGetItr(library);
            while (artistsItr.hasNext()) {
                var artist = artistsItr.next().value;
                artistAlbums[artist] = getArtistAlbums(artist);
            }
        } else {
            artistAlbums[artist] = getArtistAlbums(artist);
        }

        for (var _artist in artistAlbums) {
            for (var album in artistAlbums[_artist])
                albumList.appendChild(buildAlbumItem(_artist, artistAlbums[_artist][album]));
        }
    }
    albumList.style.height = "100%";
}

function buildShuffleListItem() {
    var list = document.getElementById("list_1");
    list.innerHTML = "";
    var shuffle_div = document.createElement("div");
    var shuffle_a = document.createElement("a");
    var shuffle_p = document.createElement("p");
    shuffle_div.id = "shuffle_div";
    shuffle_div.artist = SHUFFLE_ALL_ARTIST;
    shuffle_div.onclick = function() {
        if (selectedArtistDOM) {
            selectedArtistDOM.style.background = "";
        }
        this.style.background = "#c0dade";
        selectedArtistDOM = this;
        constructAlbumList(SHUFFLE_ALL_ARTIST); // TODO replace with const
    };
    shuffle_a.innerHTML = "Shuffle All";
    shuffle_a.onclick = function() { buildPlaylistAndPlay(); }
    shuffle_p.innerHTML = songCount + " songs";
    shuffle_p.id = "shuffle_p";

    // append shuffle elements
    shuffle_div.appendChild(shuffle_a);
    shuffle_div.appendChild(document.createElement("br"));
    shuffle_div.appendChild(shuffle_p);

    return shuffle_div;
}

function buildArtistListItem(artist, count) {
    var div = document.createElement("div");
    var a = document.createElement("a");
    var p = document.createElement("p");

    div.className = "artists";
    div.onclick = function() {
        if (selectedArtistDOM) {
            selectedArtistDOM.style.background = "";
        }
        this.style.background = "#c0dade";
        selectedArtistDOM = this;
        constructAlbumList(artist);
    };
    a.appendChild(document.createTextNode(artist));
    a.className = "artists_name";
    a.onclick = function() { buildPlaylistAndPlay(artist); }
    p.innerHTML = count + " songs";
    p.className = "artists_detail";

    //q append
    div.appendChild(a);
    div.appendChild(document.createElement("br"));
    div.appendChild(p);

    return div;
}

function buildAlbumItem(artist, album) {
    var a;
    var img;
    var div, div_left, div_right;
    var tracks = Object.values(library[artist][album]);

    div = document.createElement("div");
    div.className = "albums";
    div_left = document.createElement("div");
    div_left.className = "albums_left";
    div_right = document.createElement("div");
    div_right.className = "albums_right";
    a = document.createElement("a");
    a.className = "albums_title";
    a.appendChild(document.createTextNode(album));
    a.onclick = function() { buildPlaylistAndPlay(artist, album); }
    img = document.createElement("img");
    img.src = tracks[0].id + "/artwork";

    div.appendChild(div_left);
    div.appendChild(div_right);
    div_left.appendChild(img);
    div_right.appendChild(a);
    div_right.appendChild(document.createElement("hr"));

    img.className = "albums_artwork";

    // sort song with track_num
    tracks.sort(function(a, b) {
        var numA = a["track_num"].split("/")[0];
        var numB = b["track_num"].split("/")[0];
        return numA - numB;
    });

    // for each song in album
    for (var i = 0; i < tracks.length; i++) {
        (function(i) {
            var track = tracks[i];
            var a = document.createElement("a");
            a.className = "songs_title";
            a.appendChild(document.createTextNode(track.title));
            a.onclick = function() { buildPlaylistAndPlay(artist, album, track.id); }
            div_right.appendChild(a);
            if (i !== (tracks.length - 1)) {
                div_right.appendChild(document.createElement("br"));
            }
        })(i);
    }

    return div;
}

function sortArtistAndGetItr(_library) {
    var sortedArtists = [];
    for (var artist in _library)
        sortedArtists.push(artist);
    sortedArtists.sort();

    return iterator(sortedArtists);
}

function getArtistAlbums(artist) {
    var albums = [];

    for (var album in library[artist])
        albums.push(album);

    return albums;
}

function getAlbumTrackIds(artist, album) {
    var ids = [];

    for (var track in library[artist][album]) {
        ids.push(track);
    }

    return ids;
}

function getArtistTracksIds(artist) {
    var ids = [];

    for (var album in library[artist]) {
        ids = ids.concat(getAlbumTrackIds(artist, album));
    }

    return ids;
}

function getTrack(trackId) {
    return tracks[trackId];
}

function getLyrics(track) {
    var box = document.getElementById("lyricbox");

    box.innerHTML = "";
    box.innerHTML = "Downloading..."
    ajax("GET", "song/" + track.id + "/lyrics", true, function(req) {
        if (req.readyState == 4 && req.status == 200) {
            box.innerHTML = "";
            var lines = JSON.parse(req.responseText);
            for (i in lines) {
                var line = lines[i];
                box.innerHTML += line + "<br>";
            }
        }
    });
}

function nodeCleanChild(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function ajax(method, url, async, callback) {
    var req = new XMLHttpRequest();

    req.onreadystatechange = function() { callback(req) };
    req.open(method, url, async);
    req.send();
}

function timeAgo(time) {
    var diff = Math.floor(new Date().getTime() / 1000) - time;

    var d = Math.floor(diff / DAY);
    diff -= d * DAY;
    var h = Math.floor(diff / HOUR);
    diff -= h * HOUR;
    var m = Math.floor(diff / MINUTE);

    var s = "";
    s += (d == 0) ? "" : d + " days ";
    s += (h == 0) ? "" : h + " hours ";
    s += m + " minutes ago";

    return s;
}

function shuffleArray(arr) {
	var outArr = [];
	var len = arr.length;

	for (var i = 0; i < len; i++) {
		var pick = Math.floor(Math.random() * arr.length);
		outArr.push(arr[pick]);
		arr.splice(pick, 1);
	};

	return outArr;
}

function pad(num) { //pad number with leading 0
    if (num < 10) {
        return "0"+num;
    } else {
        return num;
    }
}

function iterator(array) {
    var idx = 0;

    return {
        current: function() {
            return {value: array[idx]};
        },
        next: function() {
            return idx < array.length ?
                {value: array[idx++], done: false} :
                {value: array[idx], done: true};
        },
        back: function() {
            return idx >= 0 ?
                {value: array[--idx], done: false} :
                {value: array[idx], done: true};
        },
        hasNext: function() {
            return idx < array.length;
        },
        hasPervious: function () {
            return idx > 0;
        },
        idx: function(newIdx) {
            if (typeof newIdx !== "undefined")
                idx = newIdx;
            return idx;
        }
    };
}

function pointer(array) {
    var idx = 0;

    return {
        current: function() {
            return {value: array[idx]};
        },
        next: function() {
            return idx < array.length ?
                {value: array[++idx], done: false} :
                {value: array[idx], done: true};
        },
        back: function() {
            return idx >= 0 ?
                {value: array[--idx], done: false} :
                {value: array[idx], done: true};
        },
        hasNext: function() {
            return idx < array.length;
        },
        hasPervious: function () {
            return idx > 0;
        },
        idx: function(newIdx) {
            if (typeof newIdx !== "undefined")
                idx = newIdx;
            return idx;
        }
    };
}
