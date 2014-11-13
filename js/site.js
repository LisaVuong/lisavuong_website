$(document).ready(function() {
    $(".content").hide();
    //toggle the component with class msg_body
    $(".heading").click(function() {
        $(this).next(".content").slideToggle(500);
    });

    colorizeImages();
});

$(window).load(function() {
    $('.flexslider').flexslider();
});

function isWebkitBrowser() {
    return /WebKit/.test(navigator.userAgent);
}

function colorizeImages () {
    var images = $('div.heading');
    var activeIdx = 0;
    var colorInterval = setInterval(function() {
        if (isWebkitBrowser()) {
            $(images[activeIdx]).addClass('color');
        } else {
            // This is a hack. Firefox doesn't support grayscale filters, and while you can grayscale
            // an image with SVG filters, it doesn't support transitioning on those.
            // Instead we create a second image the same as the first that's colored that we can fade in.
            var elem = images[activeIdx];
            var src = $(elem).find('img').attr('src');
            $(elem).find('img').after('<img src="' + src + '" class="colorOverlay">');
            $(elem).find('img.colorOverlay').fadeIn(700);
        }

        activeIdx++;

        if (activeIdx == images.length) {
            clearInterval(colorInterval);
        }

    }, 150);
}
