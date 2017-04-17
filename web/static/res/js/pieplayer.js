window.onload = function() {
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

    init();
};

function init() {
    var library_json = "";
    ajax("GET", "/library", true, function(req) {
            if (req.readyState == 4 && req.status == 200) {
                library_json = req.responseText;
                console.log(library_json);
            }
        });
}

function ajax(method, url, async, callback) {
    var req = new XMLHttpRequest();

    req.onreadystatechange = function() { callback(req) };
    req.open(method, url, async);
    req.send();
}

String.prototype.hexEncode = function() {
    var hex, i;

    var result = "";
    for (i = 0; i < this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += hex.slice(-4);
    }

    return result;
}
