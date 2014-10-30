$(document).ready(function(){
	//cache jQueries
	var _container 		= $('.container');
	var _portfolioblock	= $('.item-image');
	var _foldcontent	= $('.fold-content');
	var _tapestryimg	= $('.tapestry-img');

	//touch support?
	document.addEventListener("touchstart", function(){}, true)
	
	function resizetapestries() {
		var _windowwidth 	= $(window).width();
		var _tapestrywidth 	= _tapestryimg.width();
		var _widthdiff		= 0;
		if (_windowwidth < _tapestrywidth) {
			_widthdiff = _tapestrywidth - _windowwidth;
			console.log(_widthdiff);
			_widthdiff = (_widthdiff/2);
			_widthdiff = 0 - _widthdiff;
			_tapestryimg.css("margin-left", _widthdiff);
		}
		else if(_tapestrywidth < _windowwidth) {
			_tapestryimg.css("margin-left", 0);
		}
		else {
			console.log("nah");
		}
	}

	resizetapestries();

	$(window).resize(function() {
		resizetapestries();
	});

    $(function() {
        var num = _tapestryimg.length;
        _tapestryimg.each(function(i) {
            $(this).delay((i++)*100)
            .velocity({opacity: 1}, 300)
            .animate({filter: "greyscale(0)"}, 300);
        });
    });

	_portfolioblock.click(function() {
		var _clickindex = _portfolioblock.index(this);
    	if($(this).next().hasClass("unfolded")) {
    		$(this).next().slideUp();
    		$(this).next().removeClass("unfolded");
			$(this).find("img.tapestry-img").addClass("b_w");
			if(_clickindex===0) {
				$("html, body").animate({
		    		scrollTop: $("html, body").offset().top
		    	}, 300);
			}
    	}
    	else {
		    _foldcontent.slideUp(300);
			_foldcontent.removeClass("unfolded");
		    $(this).next().addClass("unfolded");
	    	$(this).find("img.tapestry-img").removeClass("b_w");
		    $(this).next().slideDown(200, function(){
		    	var that = $(this);
		    	setTimeout(function() {
			    	$("html, body").animate({
				   		scrollTop: that.position().top-150
				    },300);
				}, 100);
		    });
		}
	    return false;
	});		
    
	$('.slider').cbpFWSlider();
});