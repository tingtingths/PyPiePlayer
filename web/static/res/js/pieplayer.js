var library; // {artist, {album, {id, track}}}
var tracks = {};
var songCount = 0;
var cacheTime;
var cacheTimeAgo;

var selectedArtistDOM;
var playlistItr;
var playlist = [];

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

const SHUFFLE_ALL_ARTIST = "shuffle_all";

window.onload = function() {
    init();

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
    changeBkg();
    setInterval(function() {
        changeBkg();
    }, bkg_refresh_rate); //change bkg for every bkg_refresh_rate

    // set update cache time value
    setInterval(function () {
        cacheTimeAgo = timeAgo(cacheTime);
    }, 10000); // ten sec
};

var player;
var control = {
    next: function (play) {
        setCurrentTrack(playlistItr.next().value);
        if (play)
            control.resume()
    },
    back: function () {

    },
    pause: function () {

    },
    resume: function () {
        console.log(player);
        player.play()
    }
}

function setCurrentTrack(track) {
    document.getElementById("title").innerHTML = track.title;
    document.getElementById("artist").innerHTML = track.artist;
    document.getElementById("album").innerHTML = track.album;
    document.title = track.title + " - " + track.artist;

    /*
    if (lyric)
        getLyrics(currentSong["albumartist"], currentSong["album"], currentSong["title"]);
    */

    player.src = "/song/" + track.id + "/stream";
    player.load();
}

function setVolume(vol) {
    player.volume = vol/100;
    console.log(player);
}

function init() {
    var library_json = "";
    player = document.getElementById("player");
    console.log(player.volume);
    ajax("GET", "/library", true, function(req) {
        if (req.readyState == 4 && req.status == 200) {
            library_json = req.responseText;
            setupLibrary(library_json);
            constructArtistList();
        }
    });
}

function setupLibrary(json) {
    var jObj = JSON.parse(json);

    cacheTime = jObj["cached_time"];
    cacheTimeAgo = timeAgo(cacheTime);

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
    console.log(artist + " - " + album + " - " + track_id);
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
        playlist = Object.values(tracks);
    }

    playlistItr = iterator(playlist);
    control.next(true);
}

function constructArtistList() {
    var artistList = document.getElementById("list_1");

    artistList.appendChild(buildShuffleListItem());

    for (artist in library) {
        var artistSongCount = 0;
        var albums = library[artist];
        for (album in albums) {
            artistSongCount += Object.keys(library[artist][album]).length;
        }
        artistList.appendChild(buildArtistListItem(artist, artistSongCount));
    }
}

function constructAlbumList(artist) {
    if (selectedArtistDOM != artist) {
        var albumList = document.getElementById("list_2");
        nodeCleanChild(albumList);
        var artistAlbums = {};

        if (artist == SHUFFLE_ALL_ARTIST) {
            for (artist in library)
                artistAlbums[artist] = getArtistAlbums(artist);
        } else {
            artistAlbums[artist] = getArtistAlbums(artist);
        }

        for (_artist in artistAlbums) {
            for (album in artistAlbums[_artist])
                albumList.appendChild(buildAlbumItem(_artist, artistAlbums[_artist][album]));
        }
    }
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
    img.src = "/" + artist + "/" + album + "/artwork";

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

function getArtistAlbums(artist) {
    var albums = [];

    for (album in library[artist])
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

function iterator(array) {
    var idx = 0;

    return {
        next: function() {
            return idx < array.length ?
                {value: array[idx++], done: false} :
                {done: true};
        },
        back: function() {
            return idx >= 0 ? {value: array[idx--], done: false} :
                {done: true};
        },
        hasNext: function() {
            return idx < array.length;
        },
        hasPervious: function () {
            return idx > 0;
        }
    };
}