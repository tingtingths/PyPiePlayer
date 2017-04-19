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
        hasNext: function() {
            return idx < array.length;
        }
    };
}

function playlistIterator(arr) {
	var idx = 0;

	return {
		now: function() {
			return arr[idx];
		},
		next: function() {
			return arr[++idx];
		},
		back: function () {
			return arr[--idx];
        },
		hasNext: function () {
			return idx < arr.length;
        },
		hasPrevious: function () {
			return idx > 0;
        }
	}
}