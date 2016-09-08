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
