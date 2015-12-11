//background
var bkg_min = 1;
var bkg_max = 9; //how many pictures
var current = Math.floor((Math.random() * bkg_max) + bkg_min);
var bkg_refresh_rate = 480000; //8 mins
var isBkgTop = false;
var pool = [];
var img = new Image();

	changeBkg();
	setInterval(function() {
		changeBkg();
	}, bkg_refresh_rate); //change bkg for every bkg_refresh_rate

function changeBkg() {
	if (pool.length == 0) {
		for (var i = bkg_min; i <= bkg_max; i++) {
			pool.push(i);
		}
		pool = shuffleArray(pool);
	}

	// Add elements into the pool before it's empty
	// , to avoid having the same bkg.
	if (pool.length == 1) {
		var tmp = [];
		for (var i = bkg_min; i <= bkg_max; i++) {
			tmp.push(i);
		}
		tmp.splice(pool[0]-1, 1);
		tmp = shuffleArray(tmp);
		pool = pool.concat(tmp);
	}
	current = pool[0];
	pool.splice(0, 1);

	img.src = "./res/bkg/bkg_" + current + ".jpg";
	img.onload = function() { //wait untill the image is loaded
		if (isBkgTop) {
			document.getElementById("bkgTop").style.backgroundImage = "url(" + img.src + ")";
			document.getElementById("bkgTop").style.opacity = "1";

			isBkgTop = false;
		} else {
			document.getElementById("bkgBottom").style.backgroundImage = "url(" + img.src + ")";;
			document.getElementById("bkgTop").style.opacity = "0";
			isBkgTop = true;
		}
	};
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
