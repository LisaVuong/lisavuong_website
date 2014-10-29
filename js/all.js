$(document).ready(function(){
	//cache jQueries
	var _container 		= $('.container');
	var _portfolioblock	= $('.item-image');
	var _foldcontent	= $('.fold-content');
	var _bannerimg		= $('.banner-img');

	//touch support?
	document.addEventListener("touchstart", function(){}, true)
	
	function resizeBanners() {
		var _windowwidth 	= $(window).width();
		var _bannerwidth 	= _bannerimg.width();
		var _widthdiff		= 0;
		if (_windowwidth < _bannerwidth) {
			_widthdiff = _bannerwidth - _windowwidth;
			console.log(_widthdiff);
			_widthdiff = (_widthdiff/2);
			_widthdiff = 0 - _widthdiff;
			_bannerimg.css("margin-left", _widthdiff);
		}
		else if(_bannerwidth < _windowwidth) {
			_bannerimg.css("margin-left", 0);
		}
		else {
			console.log("nah");
		}
	}

	resizeBanners();

	$(window).resize(function() {
		resizeBanners();
	});

    $(function() {
        var num = _bannerimg.length;
        _bannerimg.each(function(i) {
            $(this).delay((i++)*100)
            .velocity({opacity: 1}, 150)
            .animate({filter: "greyscale(0)"}, 300);
            // .velocity({opacity: 0.2}, 250)
            // .velocity({opacity: 1}, 250)
        });
    });

		_portfolioblock.click(function() {
			var _clickindex = _portfolioblock.index(this);
			console.log(_clickindex);
	    	if($(this).next().hasClass("unfolded")){
	    		$(this).next().slideUp();
	    		$(this).next().removeClass("unfolded");
    		$(this).find("img.banner-img").addClass("b_w");
	    	}
	    	else {
			    _foldcontent.slideUp(300);
				_foldcontent.removeClass("unfolded");
			    $(this).next().addClass("unfolded");
		    $(this).find("img.banner-img").removeClass("b_w");
			    $(this).next().slideDown(200, function(){
			    	var that = $(this);
			    	$("html, body").animate({
			    		scrollTop: that.offset().top-150
			    	},300);
			    });
			}
		    return false;
		});		
    
	$('.slider').cbpFWSlider();
});