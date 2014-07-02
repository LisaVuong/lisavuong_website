/*
* Curtain.js - Create an unique page transitioning system
* ---
* Version: 2
* Copyright 2011, Victor Coulon (http://victorcoulon.fr)
* Released under the MIT Licence
*/

(function ( $, window, document, undefined ) {

    var pluginName = 'curtain',
        defaults = {
            scrollSpeed: 400,
            bodyHeight: 0,
            linksArray: [],
            mobile: false,
            scrollButtons: {},
            controls: null,
            curtainLinks: '.curtain-links',
            enableKeys: true,
            easing: 'swing',
            disabled: false,
            nextSlide: function() {},
            prevSlide: function() {}
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        var self = this;

        // Public attributes
        this.element = element;
        this.options = $.extend( {}, defaults, options) ;

        this._defaults = defaults;
        this._name = pluginName;
        this._ignoreHashChange = false;

        this.init();
    }

    Plugin.prototype = {
        init: function () {
            var self = this;

            // Cache element
            this.$element = $(this.element);
            this.$li = $(this.element).find('>li');
            this.$liLength = this.$li.length;
            self.$windowHeight = $(window).height();
            self.$elDatas = {};
            self.$document = $(document);
            self.$window = $(window);


            self.webkit = (navigator.userAgent.indexOf('Chrome') > -1 || navigator.userAgent.indexOf("Safari") > -1);
            $.Android = (navigator.userAgent.match(/Android/i));
            $.iPhone = ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)));
            $.iPad = ((navigator.userAgent.match(/iPad/i)));
            $.iOs4 = (/OS [1-4]_[0-9_]+ like Mac OS X/i.test(navigator.userAgent));
            
            if($.iPhone || $.iPad || $.Android || self.options.disabled){
                this.options.mobile = true;
                this.$li.css({position:'relative'});
                this.$element.find('.fixed').css({position:'absolute'});
            }

            if(this.options.mobile){
               this.scrollEl =  this.$element;
            } else if($.browser.mozilla || $.browser.msie) {
                this.scrollEl = $('html');
            } else {
                this.scrollEl = $('body');
            }

            if(self.options.controls){
                self.options.scrollButtons['up'] =  $(self.options.controls).find('[href="#up"]');
                self.options.scrollButtons['down'] =  $(self.options.controls).find('[href="#down"]');

                if(!$.iOs4 && ($.iPhone || $.iPad)){
                    self.$element.css({
                        position:'fixed',
                        top:0,
                        left:0,
                        right:0,
                        bottom:0,
                        '-webkit-overflow-scrolling':'touch',
                        overflow:'auto'
                    });
                    $(self.options.controls).css({position:'absolute'});
                }
            }

            // When all image is loaded
            var callbackImageLoaded = function(){
                self.setDimensions();
                self.$li.eq(0).addClass('current');

                self.setCache();
                
                if(!self.options.mobile){
                    if(self.$li.eq(1).length)
                        self.$li.eq(1).nextAll().addClass('hidden');
                }

                self.setEvents();
                self.setLinks();
                self.isHashIsOnList(location.hash.substring(1));
            };

            if(self.$element.find('img').length)
                self.imageLoaded(callbackImageLoaded);
            else
                callbackImageLoaded();

        },
        // Events
        scrollToPosition: function (direction){
            var position = null,
                self = this;

            if(self.scrollEl.is(':animated')){
                return false;
            }

            if(direction === 'up' || direction == 'down'){
                // Keyboard event
                var $next = (direction === 'up') ? self.$current.prev() : self.$current.next();

                // Step in the current panel ?
                if(self.$step){

                    if(!self.$current.find('.current-step').length){
                        self.$step.eq(0).addClass('current-step');
                    }
                        
                    var $nextStep = (direction === 'up') ? self.$current.find('.current-step').prev('.step') : self.$current.find('.current-step').next('.step');

                    if($nextStep.length) {
                        position = (self.options.mobile) ? $nextStep.position().top + self.$elDatas[self.$current.index()]['data-position'] : $nextStep.position().top + self.$elDatas[self.$current.index()]['data-position'];
                    }
                }

                position = position || ((self.$elDatas[$next.index()] === undefined) ? null : self.$elDatas[$next.index()]['data-position']);

                if(position !== null){
                    self.scrollEl.animate({
                        scrollTop: position
                    }, self.options.scrollSpeed, self.options.easing);
                }

            } else if(direction === 'top'){
                self.scrollEl.animate({
                    scrollTop:0
                }, self.options.scrollSpeed, self.options.easing);
            } else if(direction === 'bottom'){
                self.scrollEl.animate({
                    scrollTop:self.options.bodyHeight
                }, self.options.scrollSpeed, self.options.easing);
            } else {
                var index = $("#"+direction).index(),
                    speed = Math.abs(self.currentIndex-index) * (this.options.scrollSpeed*4) / self.$liLength;

                self.scrollEl.animate({
                    scrollTop:self.$elDatas[index]['data-position'] || null
                }, (speed <= self.options.scrollSpeed) ? self.options.scrollSpeed : speed, this.options.easing);
            }
            
        },
        scrollEvent: function() {
            var self = this,
                docTop = self.$document.scrollTop();

            if(docTop < self.currentP && self.currentIndex > 0){
                // Scroll to top
                self._ignoreHashChange = true;

                if(self.$current.prev().attr('id'))
                    self.setHash(self.$current.prev().attr('id'));
                
                self.$current
                    .removeClass('current')
                    .css( (self.webkit) ? {'-webkit-transform': 'translateY(0px) translateZ(0)'} : {marginTop: 0} )
                    .nextAll().addClass('hidden').end()
                    .prev().addClass('current').removeClass('hidden');
  
                self.setCache();
                self.options.prevSlide();

            } else if(docTop < (self.currentP + self.currentHeight)){

                // Animate the current pannel during the scroll
                if(self.webkit)
                    self.$current.css({'-webkit-transform': 'translateY('+(-(docTop-self.currentP))+'px) translateZ(0)' });
                else
                    self.$current.css({marginTop: -(docTop-self.currentP) });

                // If there is a fixed element in the current panel
                if(self.$fixedLength){
                    var dataTop = parseInt(self.$fixed.attr('data-top'), 10);

                    if(docTop + self.$windowHeight >= self.currentP + self.currentHeight){
                        self.$fixed.css({
                            position: 'fixed'
                        });
                    } else {
                        self.$fixed.css({
                            position: 'absolute',
                            marginTop: Math.abs(docTop-self.currentP)
                        });
                    }
                }
                
                // If there is a step element in the current panel
                if(self.$stepLength){
                    $.each(self.$step, function(i,el){
                        if(($(el).position().top+self.currentP) <= docTop+5 && $(el).position().top + self.currentP + $(el).height() >= docTop+5){
                            if(!$(el).hasClass('current-step')){
                                self.$step.removeClass('current-step');
                                $(el).addClass('current-step');
                                return false;
                            }
                        }
                    });
                }


                if(self.parallaxBg){
                    self.$current.css({
                        'background-position-y': docTop * self.parallaxBg
                    });
                }

                if(self.$fade.length){
                    self.$fade.css({
                        'opacity': 1-(docTop/ self.$fade.attr('data-fade'))
                    });
                }

                if(self.$slowScroll.length){
                    self.$slowScroll.css({
                        'margin-top' : (docTop / self.$slowScroll.attr('data-slow-scroll'))
                    });
                }

            } else {
                // Scroll bottom
                self._ignoreHashChange = true;
                if(self.$current.next().attr('id'))
                    self.setHash(self.$current.next().attr('id'));

                self.$current.removeClass('current')
                    .addClass('hidden')
                    .next('li').addClass('current').next('li').removeClass('hidden');

                self.setCache();
                self.options.nextSlide();
            }

        },
        scrollMobileEvent: function() {
            var self = this,
                docTop = self.$element.scrollTop();

            if(docTop+10 < self.currentP && self.currentIndex > 0){

                // Scroll to top
                self._ignoreHashChange = true;

                if(self.$current.prev().attr('id'))
                    self.setHash(self.$current.prev().attr('id'));

                self.$current.removeClass('current').prev().addClass('current');
                self.setCache();
                self.options.prevSlide();
            } else if(docTop+10 < (self.currentP + self.currentHeight)){

                // If there is a step element in the current panel
                if(self.$stepLength){
                    $.each(self.$step, function(i,el){
                        if(($(el).position().top+self.currentP) <= docTop && (($(el).position().top+self.currentP) + $(el).outerHeight()) >= docTop){
                            if(!$(el).hasClass('current-step')){
                                self.$step.removeClass('current-step');
                                $(el).addClass('current-step');
                            }
                        }
                    });
                }

            } else {

                // Scroll bottom
                self._ignoreHashChange = true;
                if(self.$current.next().attr('id'))
                    self.setHash(self.$current.next().attr('id'));

                self.$current.removeClass('current').next().addClass('current');
                self.setCache();
                self.options.nextSlide();
            }


        },
        // Setters
        setDimensions: function(){
            var self = this,
                levelHeight = 0,
                cover = false,
                height = null;
            
            self.$windowHeight = self.$window.height();

            this.$li.each(function(index) {
                var $self = $(this);
                cover = $self.hasClass('cover');

                if(cover){
                    $self.css({height: self.$windowHeight, zIndex: 999-index})
                        .attr('data-height',self.$windowHeight)
                        .attr('data-position',levelHeight);

                    self.$elDatas[$self.index()] = {
                        'data-height': parseInt(self.$windowHeight,10),
                        'data-position': parseInt(levelHeight, 10)
                    };

                    levelHeight += self.$windowHeight;

                } else{
                    height = ($self.outerHeight() <= self.$windowHeight) ? self.$windowHeight : $self.outerHeight();
                    $self.css({minHeight: height, zIndex: 999-index})
                        .attr('data-height',height)
                        .attr('data-position',levelHeight);
                    
                     self.$elDatas[$self.index()] = {
                        'data-height': parseInt(height, 10),
                        'data-position': parseInt(levelHeight, 10)
                    };

                    levelHeight += height;
                }

                if($self.find('.fixed').length){
                    var top = $self.find('.fixed').css('top');
                    $self.find('.fixed').attr('data-top', top);
                }
            });
            if(!this.options.mobile)
                this.setBodyHeight();
        },
        setEvents: function() {
            var self = this;

            $(window).on('resize', function(){
                self.setDimensions();
            });

            if(self.options.mobile) {
                self.$element.on('scroll', function(){
                    self.scrollMobileEvent();
                });
            } else {
                self.$window.on('scroll', function(){
                    self.scrollEvent();
                });
            }
            
            if(self.options.enableKeys) {
                self.$document.on('keydown', function(e){
                    if(e.keyCode === 38 || e.keyCode === 37) {
                        self.scrollToPosition('up');
                        e.preventDefault();
                        return false;
                    }
                    if(e.keyCode === 40 || e.keyCode === 39){
                        self.scrollToPosition('down');
                        e.preventDefault();
                        return false;
                    }
                    // Home button
                    if(e.keyCode === 36){
                        self.scrollToPosition('top');
                        e.preventDefault();
                        return false;
                    }
                    // End button
                    if(e.keyCode === 35){
                        self.scrollToPosition('bottom');
                        e.preventDefault();
                        return false;
                    }
                });
            }

            if(self.options.scrollButtons){
                if(self.options.scrollButtons.up){
                    self.options.scrollButtons.up.on('click', function(e){
                        e.preventDefault();
                        self.scrollToPosition('up');
                    });
                }
                if(self.options.scrollButtons.down){
                    self.options.scrollButtons.down.on('click', function(e){
                        e.preventDefault();
                        self.scrollToPosition('down');
                    });
                }
            }

            if(self.options.curtainLinks){
                $(self.options.curtainLinks).on('click', function(e){
                    e.preventDefault();
                    var href = $(this).attr('href');
                    
                    if(!self.isHashIsOnList(href.substring(1)) && position)
                        return false;
                    var position = self.$elDatas[$(href).index()]['data-position'] || null;

                    if(position){
                        self.scrollEl.animate({
                            scrollTop:position
                        }, self.options.scrollSpeed, self.options.easing);
                    }
                    return false;
                });
            }

            self.$window.on("hashchange", function(event){
                if(self._ignoreHashChange === false){
                    self.isHashIsOnList(location.hash.substring(1));
                }
                self._ignoreHashChange = false;
            });
        },
        setBodyHeight: function(){
            var h = 0;

            for (var key in this.$elDatas) {
               var obj = this.$elDatas[key];
               h += obj['data-height'];
            }
  
            this.options.bodyHeight = h;
            $('body').height(h);
        },
        setLinks: function(){
            var self = this;
            this.$li.each(function() {
                var id = $(this).attr('id') || 0;
                self.options.linksArray.push(id);
            });
        },
        setHash: function(hash){
            // "HARD FIX"
            el = $('[href=#'+hash+']');
            el.parent().siblings('li').removeClass('active');
            el.parent().addClass('active');

            if(history.pushState) {
                history.pushState(null, null, '#'+hash);
            }
            else {
                location.hash = hash;
            }
        },
        setCache: function(){
            var self = this;
            self.$current = self.$element.find('.current');
            self.$fixed = self.$current.find('.fixed');
            self.$fixedLength = self.$fixed.length;
            self.$step = self.$current.find('.step');
            self.$stepLength = self.$step.length;
            self.currentIndex = self.$current.index();
            self.currentP = self.$elDatas[self.currentIndex]['data-position'];
            self.currentHeight = self.$elDatas[self.currentIndex]['data-height'];

            self.parallaxBg = self.$current.attr('data-parallax-background');
            self.$fade = self.$current.find('[data-fade]');
            self.$slowScroll = self.$current.find('[data-slow-scroll]');

        },
        // Utils
        isHashIsOnList: function(hash){
            var self = this;
            $.each(self.options.linksArray, function(i,val){
                if(val === hash){
                    self.scrollToPosition(hash);
                    return false;
                }
            });
        },
        readyElement: function(el,callback){
          var interval = setInterval(function(){
            if(el.length){
              callback(el.length);
              clearInterval(interval);
            }
          },60);
        },
        imageLoaded: function(callback){
            var self = this,
                elems = self.$element.find('img'),
                len   = elems.length,
                blank = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

            elems.bind('load.imgloaded',function(){
                if (--len <= 0 && this.src !== blank || $(this).not(':visible')){
                    elems.unbind('load.imgloaded');
                    callback.call(elems,this);
                }
            }).each(function(){
                if (this.complete || this.complete === undefined){
                    var src = this.src;
                    this.src = blank;
                    this.src = src;
                }
            });
        }
    };



    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
            }
        });
    };


})( jQuery, window, document );

/*
    By Osvaldas Valutis, www.osvaldas.info
    Available for use under the MIT License
*/



;(function( $, window, document, undefined )
{
    var isTouch       = 'ontouchstart' in window,
        eStart        = isTouch ? 'touchstart'  : 'mousedown',
        eMove         = isTouch ? 'touchmove'   : 'mousemove',
        eEnd          = isTouch ? 'touchend'    : 'mouseup',
        eCancel       = isTouch ? 'touchcancel' : 'mouseup',
        secondsToTime = function( secs )
        {
            var hoursDiv = secs / 3600, hours = Math.floor( hoursDiv ), minutesDiv = secs % 3600 / 60, minutes = Math.floor( minutesDiv ), seconds = Math.ceil( secs % 3600 % 60 );
            if( seconds > 59 ) { seconds = 0; minutes = Math.ceil( minutesDiv ); }
            if( minutes > 59 ) { minutes = 0; hours = Math.ceil( hoursDiv ); }
            return ( hours == 0 ? '' : hours > 0 && hours.toString().length < 2 ? '0'+hours+':' : hours+':' ) + ( minutes.toString().length < 2 ? '0'+minutes : minutes ) + ':' + ( seconds.toString().length < 2 ? '0'+seconds : seconds );
        },
        canPlayType   = function( file )
        {
            var audioElement = document.createElement( 'audio' );
            return !!( audioElement.canPlayType && audioElement.canPlayType( 'audio/' + file.split( '.' ).pop().toLowerCase() + ';' ).replace( /no/, '' ) );
        };

    $.fn.audioPlayer = function( params )
    {
        var params      = $.extend( { classPrefix: 'audioplayer', strPlay: 'Play', strPause: 'Pause', strVolume: 'Volume' }, params ),
            cssClass    = {},
            cssClassSub =
            {
                playPause:      'playpause',
                playing:        'playing',
                stopped:        'stopped',
                time:           'time',
                timeCurrent:    'time-current',
                timeDuration:   'time-duration',
                bar:            'bar',
                barLoaded:      'bar-loaded',
                barPlayed:      'bar-played',
                volume:         'volume',
                volumeButton:   'volume-button',
                volumeAdjust:   'volume-adjust',
                noVolume:       'novolume',
                muted:          'muted',
                mini:           'mini'
            };

        for( var subName in cssClassSub )
            cssClass[ subName ] = params.classPrefix + '-' + cssClassSub[ subName ];

        this.each( function()
        {
            if( $( this ).prop( 'tagName' ).toLowerCase() != 'audio' )
                return false;

            var $this      = $( this ),
                audioFile  = $this.attr( 'src' ),
                isAutoPlay = $this.get( 0 ).getAttribute( 'autoplay' ), isAutoPlay = isAutoPlay === '' || isAutoPlay === 'autoplay' ? true : false,
                isLoop     = $this.get( 0 ).getAttribute( 'loop' ),     isLoop     = isLoop     === '' || isLoop     === 'loop'     ? true : false,
                isSupport  = false;

            if( typeof audioFile === 'undefined' )
            {
                $this.find( 'source' ).each( function()
                {
                    audioFile = $( this ).attr( 'src' );
                    if( typeof audioFile !== 'undefined' && canPlayType( audioFile ) )
                    {
                        isSupport = true;
                        return false;
                    }
                });
            }
            else if( canPlayType( audioFile ) ) isSupport = true;

            var thePlayer = $( '<div class="' + params.classPrefix + '">' + ( isSupport ? $( '<div>' ).append( $this.eq( 0 ).clone() ).html() : '<embed src="' + audioFile + '" width="0" height="0" volume="100" autostart="' + isAutoPlay.toString() +'" loop="' + isLoop.toString() + '" />' ) + '<div class="' + cssClass.playPause + '" title="' + params.strPlay + '"><a href="#">' + params.strPlay + '</a></div></div>' ),
                theAudio  = isSupport ? thePlayer.find( 'audio' ) : thePlayer.find( 'embed' ), theAudio = theAudio.get( 0 );

            if( isSupport )
            {
                thePlayer.find( 'audio' ).css( { 'width': 0, 'height': 0, 'visibility': 'hidden' } );
                thePlayer.append( '<div class="' + cssClass.time + ' ' + cssClass.timeCurrent + '"></div><div class="' + cssClass.bar + '"><div class="' + cssClass.barLoaded + '"></div><div class="' + cssClass.barPlayed + '"></div></div><div class="' + cssClass.time + ' ' + cssClass.timeDuration + '"></div><div class="' + cssClass.volume + '"><div class="' + cssClass.volumeButton + '" title="' + params.strVolume + '"><a href="#">' + params.strVolume + '</a></div><div class="' + cssClass.volumeAdjust + '"><div><div></div></div></div></div>' );

                var theBar            = thePlayer.find( '.' + cssClass.bar ),
                    barPlayed         = thePlayer.find( '.' + cssClass.barPlayed ),
                    barLoaded         = thePlayer.find( '.' + cssClass.barLoaded ),
                    timeCurrent       = thePlayer.find( '.' + cssClass.timeCurrent ),
                    timeDuration      = thePlayer.find( '.' + cssClass.timeDuration ),
                    volumeButton      = thePlayer.find( '.' + cssClass.volumeButton ),
                    volumeAdjuster    = thePlayer.find( '.' + cssClass.volumeAdjust + ' > div' ),
                    volumeDefault     = 0,
                    adjustCurrentTime = function( e )
                    {
                        theRealEvent         = isTouch ? e.originalEvent.touches[ 0 ] : e;
                        theAudio.currentTime = Math.round( ( theAudio.duration * ( theRealEvent.pageX - theBar.offset().left ) ) / theBar.width() );
                    },
                    adjustVolume = function( e )
                    {
                        theRealEvent    = isTouch ? e.originalEvent.touches[ 0 ] : e;
                        theAudio.volume = Math.abs( ( theRealEvent.pageY - ( volumeAdjuster.offset().top + volumeAdjuster.height() ) ) / volumeAdjuster.height() );
                    },
                    updateLoadBar = function()
                    {
                        var interval = setInterval( function()
                        {
                            if( theAudio.buffered.length < 1 ) return true;
                            barLoaded.width( ( theAudio.buffered.end( 0 ) / theAudio.duration ) * 100 + '%' );
                            if( Math.floor( theAudio.buffered.end( 0 ) ) >= Math.floor( theAudio.duration ) ) clearInterval( interval );
                        }, 100 );
                    };

                var volumeTestDefault = theAudio.volume, volumeTestValue = theAudio.volume = 0.111;
                if( Math.round( theAudio.volume * 1000 ) / 1000 == volumeTestValue ) theAudio.volume = volumeTestDefault;
                else thePlayer.addClass( cssClass.noVolume );

                timeDuration.html( '&hellip;' );
                timeCurrent.html( secondsToTime( 0 ) );

                theAudio.addEventListener( 'loadeddata', function()
                {
                    updateLoadBar();
                    timeDuration.html( $.isNumeric( theAudio.duration ) ? secondsToTime( theAudio.duration ) : '&hellip;' );
                    volumeAdjuster.find( 'div' ).height( theAudio.volume * 100 + '%' );
                    volumeDefault = theAudio.volume;
                });

                theAudio.addEventListener( 'timeupdate', function()
                {
                    timeCurrent.html( secondsToTime( theAudio.currentTime ) );
                    barPlayed.width( ( theAudio.currentTime / theAudio.duration ) * 100 + '%' );
                });

                theAudio.addEventListener( 'volumechange', function()
                {
                    volumeAdjuster.find( 'div' ).height( theAudio.volume * 100 + '%' );
                    if( theAudio.volume > 0 && thePlayer.hasClass( cssClass.muted ) ) thePlayer.removeClass( cssClass.muted );
                    if( theAudio.volume <= 0 && !thePlayer.hasClass( cssClass.muted ) ) thePlayer.addClass( cssClass.muted );
                });

                theAudio.addEventListener( 'ended', function()
                {
                    thePlayer.removeClass( cssClass.playing ).addClass( cssClass.stopped );
                });

                theBar.on( eStart, function( e )
                {
                    adjustCurrentTime( e );
                    theBar.on( eMove, function( e ) { adjustCurrentTime( e ); } );
                })
                .on( eCancel, function()
                {
                    theBar.unbind( eMove );
                });

                volumeButton.on( 'click', function()
                {
                    if( thePlayer.hasClass( cssClass.muted ) )
                    {
                        thePlayer.removeClass( cssClass.muted );
                        theAudio.volume = volumeDefault;
                    }
                    else
                    {
                        thePlayer.addClass( cssClass.muted );
                        volumeDefault = theAudio.volume;
                        theAudio.volume = 0;
                    }
                    return false;
                });

                volumeAdjuster.on( eStart, function( e )
                {
                    adjustVolume( e );
                    volumeAdjuster.on( eMove, function( e ) { adjustVolume( e ); } );
                })
                .on( eCancel, function()
                {
                    volumeAdjuster.unbind( eMove );
                });
            }
            else thePlayer.addClass( cssClass.mini );

            thePlayer.addClass( isAutoPlay ? cssClass.playing : cssClass.stopped );

            thePlayer.find( '.' + cssClass.playPause ).on( 'click', function()
            {
                if( thePlayer.hasClass( cssClass.playing ) )
                {
                    $( this ).attr( 'title', params.strPlay ).find( 'a' ).html( params.strPlay );
                    thePlayer.removeClass( cssClass.playing ).addClass( cssClass.stopped );
                    isSupport ? theAudio.pause() : theAudio.Stop();
                }
                else
                {
                    $( this ).attr( 'title', params.strPause ).find( 'a' ).html( params.strPause );
                    thePlayer.addClass( cssClass.playing ).removeClass( cssClass.stopped );
                    isSupport ? theAudio.play() : theAudio.Play();
                }
                return false;
            });

            $this.replaceWith( thePlayer );
        });
        return this;
    };
})( jQuery, window, document );
