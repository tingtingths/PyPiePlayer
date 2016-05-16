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

var player;
var playerStatus = 0; //0 = stop, 1 = pause, 2 = playing

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
    player = document.getElementById("player");
    player.onended = function() {
            setPlayerState(2);
            nextTrack();
    };
    player.onpause = function() {
        setPlayerState(1);
    };
    player.onplay = function() {
        setPlayerState(2);
    };
    document.getElementById("volumeSlider").value = vol * 100;
    var list_2 = document.getElementById("list_2");
    list_2.width -= 4;
    curVol = document.getElementById("volumeSlider").value;
    setVolume(curVol);
    getList1();
    setInterval(function() { updatePos() }, refreshRate);

    changeBkg();
	setInterval(function() {
		changeBkg();
	}, bkg_refresh_rate); //change bkg for every bkg_refresh_rate
};

function hoverProgressText(ele) {
    document.getElementById("progressText").style.opacity = "1";
    setTimeout(function() {
        document.getElementById("progressText").style.opacity = "0";
    }, 2500);
}

function updatePos() {
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

function nextTrack() {
    if (playlist.length > 0) {
        var idx = shuffle ? Math.floor(Math.random() * playlist.length) : 0;
        var song = playlist[idx];
        prevList.push(song);
        getAudioStream(song[0], song[1], song[2].title);
        playlist.splice(idx, 1);
    }
}

function backTrack() {
    var pos = player.currentTime;

    // prev song
    if (pos <= 3) {
        playlist.unshift(prevList.pop());
        playlist.unshift(prevList.pop());
        shuffle = false;
        nextTrack();
        shuffle = true;
    } else { // reset song
        var lastSong = prevList.pop();
        playlist.unshift(lastSong);
        shuffle = false;
        nextTrack();
        shuffle = true;
    }
}

function playPause() {
    if (playerStatus == 2) {
        player.pause();
    } else if (playerStatus == 1 || playerStatus == 0) {
        player.play();
    }
}

function setVolume(vol) {
    player.volume = vol/100;
}

function setProgress(event) {
    var bar = document.getElementById("progress");
    var x = event.pageX - bar.offsetLeft;
    var value = x * bar.max / bar.offsetWidth;

    player.currentTime = value;
}

function toggleShuffle() {
    if (shuffle)
        document.getElementById("shuffleBtn").setAttribute("style", "-webkit-filter: invert(50%)");
    else
        document.getElementById("shuffleBtn").setAttribute("style", "");

    shuffle = !shuffle;
}

function setPlayerState(state) {
    if (playerStatus != state) {
        if (state == 0) {
            playerStatus = state;
            document.getElementById("playPauseBtn").src = "./res/image/" + playBtn;
        }
        if (state == 1) {
            playerStatus = state;
            document.getElementById("playPauseBtn").src = "./res/image/" + playBtn;
        }
        if (state == 2) {
            playerStatus = state;
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
        getLyrics(currentSong["artist"], currentSong["album"], currentSong["title"]);
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

    playerStatus = 2;
    nextTrack();
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

    playerStatus = 2;
    nextTrack();
}

function playAlbum(artist, album) {
    playlist = [];

    for (i in artists[artist][album]) {
        var title = artists[artist][album][i]
        playlist.push([artist, album, title]);
    }

    playerStatus = 2;
    nextTrack();
}

function playSingle(artist, album, title) {
    playlist = [];

    playlist.push([artist, album, title]);
    playerStatus = 2;
    nextTrack();
}

function getArtwork(artist, album) { //album title
    var id = getIdOfFirstSong(artist, album);
    var imageUrl = "";

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
    req.open("GET", "api?req=cover&id=" + id + "&now=" + new Date(), true);
    req.send();
}

function getAudioStream(artist, album, title) {
    var id = getId(artist, album, title);
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            var path = req.responseText;
            player.src = path;
            player.load();
            if (artist != currentSong["artist"] || album != currentSong["album"])
                getArtwork(artist, album);
            currentSong["artist"] = artist;
            currentSong["album"] = album;
            currentSong["title"] = title;
            notifySongChange();
            if (playerStatus == 2) {
                player.play();
                document.getElementById("playPauseBtn").src = "./res/image/" + pauseBtn;
            }
        }
    }
    req.open("GET", "api?req=stream&id=" + id + "&now=" + new Date(), true);
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

                    imgs[count].className = "albums_artwork";

                    // for each song in album
                    for (i in display_albums[album]) {
                        (function(i) {
                            var track = display_albums[album][i];
                            var a = document.createElement("a");
                            a.className = "songs_title";
                            a.appendChild(document.createTextNode(track.title));
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

                    var req = new XMLHttpRequest();
                    req.onreadystatechange = function() {
                        if (req.readyState == 4 && req.status == 200) {
                            var path = req.responseText;
                            imgs[count].src = path;
                        }
                    }
                    var id = getIdOfFirstSong(artist, album);
                    req.open("GET", "api?req=cover&id=" + id + "&now=" + new Date(), true);
                    req.send();
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

function enableLyrics() {
    if (lyric) {
        lyric = false;
        document.getElementById("getLyricBtn").style.color = "white";
        document.getElementById("lyricbox").style.display = "none";
    } else {
        lyric = true;
        document.getElementById("getLyricBtn").style.color = "rgb(255, 92, 92)";
        document.getElementById("lyricbox").style.display = "block";
        getLyrics(currentSong["artist"], currentSong["album"], currentSong["title"]);
    }
}

function getLyrics(artist, album, title) {
    var req = new XMLHttpRequest();
    var id  = getId(artist, album, title);
    var box = document.getElementById("lyricbox");

    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            box.innerHTML = "";
            var lines = JSON.parse(req.responseText);
            for (i in lines) {
                var line = lines[i];
                box.innerHTML += line + "<br>";
            }
        }
    }
    box.innerHTML = "";
    box.innerHTML = "Downloading..."
    req.open("GET", "api?req=lyrics&id=" + id + "&now=" + new Date(), true);
    req.send();
}

function getId(artist, album, title) {
    for (i in artists[artist][album]) {
        var song = artists[artist][album][i];
        if (song.title == title) {
            return song.id;
        }
    }
    return -1;
}

function getIdOfFirstSong(artist, album) {
    return artists[artist][album][0].id;
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
