/**
 * Scratch-off canvas
 *
 * NOTE: this code monkeypatches Function.prototype.bind() if it doesn't
 * already exist.
 *
 * NOTE: This is demo code that has been converted to be less demo-y.
 * But it is still demo-y.
 *
 * To make (more) correct:
 *  o   add error handling on image loads
 *  o   fix inefficiencies
 *
 * depends on jQuery>=1.7
 *
 * Copyright (c) 2012 Brian "Beej Jorgensen" Hall <beej@beej.us>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

Scratcher = (function () {

    /**
     * Helper function to extract the coordinates from an event, whether the
     * event is a mouse or touch.
     */
    function getEventCoords(ev) {
        var first, coords = {};
        var origEv = ev.originalEvent; // get from jQuery

        if (origEv.changedTouches != undefined) {
            first = origEv.changedTouches[0];
            coords.pageX = first.pageX;
            coords.pageY = first.pageY;
        } else {
            coords.pageX = ev.pageX;
            coords.pageY = ev.pageY;
        }

        return coords;
    };

    /**
     * Helper function to get the local coords of an event in an element.
     *
     * @param elem element in question
     * @param ev the event
     */
    function getLocalCoords(elem, coords) {
        var offset = $(elem).offset();
        return {
            'x': coords.pageX - offset.left,
            'y': coords.pageY - offset.top
        };
    };

    /**
     * Construct a new scratcher object
     *
     * @param canvasId [string] the canvas DOM ID, e.g. 'canvas2'
     * @param backImage [string, optional] URL to background (bottom) image
     * @param frontImage [string, optional] URL to foreground (top) image
     */
    function Scratcher(canvasId, backImage) {
        this.canvas = {
            'main': $('#' + canvasId).get(0)
        };

        this.fresh = true;

        this.mouseDown = true;

        this.canvasId = canvasId;

        this._setupCanvases(); // finish setup from constructor now

        this.setImages(backImage);

        this._eventListeners = {};
    };

    /**
     * Set the images to use
     */
    Scratcher.prototype.setImages = function (backImage) {
        this.image = {
            'back': { 'url': backImage, 'img': null }
        };

        if (backImage) {
            this._loadImages(); // start image loading from constructor now
        }
    };

    /**
     * Returns how scratched the scratcher is
     *
     * By adjusting the stride, you get a less accurate result, but it is
     * quicker to compute (pixels are skipped)
     *
     * @param stride [optional] pixel step value, default 1
     *
     * @return the fraction the canvas has been scratched (0.0 -> 1.0)
     */
    Scratcher.prototype.fullAmount = function (stride) {
        var i, l;
        var can = this.canvas.main;
        var ctx = can.getContext('2d');
        var count, total;
        var pixels, pdata;

        if (!stride || stride < 1) {
            stride = 1;
        }

        stride *= 4; // 4 elements per pixel

        pixels = ctx.getImageData(0, 0, can.width, can.height);
        pdata = pixels.data;
        l = pdata.length; // 4 entries per pixel

        total = (l / stride) | 0;

        for (i = count = 0; i < l; i += stride) {
            if (pdata[i] != 0) {
                count++;
            }
        }

        return count / total;
    };

    /**
     * Recomposites the canvases onto the screen
     *
     * Note that my preferred method (putting the background down, then the
     * masked foreground) doesn't seem to work in FF with "source-out"
     * compositing mode (it just leaves the destination canvas blank.)  I
     * like this method because mentally it makes sense to have the
     * foreground drawn on top of the background.
     *
     * Instead, to get the same effect, we draw the whole foreground image,
     * and then mask the background (with "source-atop", which FF seems
     * happy with) and stamp that on top.  The final result is the same, but
     * it's a little bit weird since we're stamping the background on the
     * foreground.
     *
     * OPTIMIZATION: This naively redraws the entire canvas, which involves
     * four full-size image blits.  An optimization would be to track the
     * dirty rectangle in scratchLine(), and only redraw that portion (i.e.
     * in each drawImage() call, pass the dirty rectangle as well--check out
     * the drawImage() documentation for details.)  This would scale to
     * arbitrary-sized images, whereas in its current form, it will dog out
     * if the images are large.
     */
    Scratcher.prototype.recompositeCanvases = function () {
        var can = this.canvas.main;
        var ctx = can.getContext('2d');
        ctx.globalCompositeOperation = 'copy';
        ctx.drawImage(this.image.back.img, 0, 0);
        ctx.globalCompositeOperation = 'destination-out';
    };

    /**
     * Draw a scratch line
     *
     * Dispatches the 'scratch' event.
     *
     * @param x,y the coordinates
     * @param fresh start a new line if true
     */
    Scratcher.prototype.scratchLine = function (x, y) {
        var can = this.canvas.main;
        var ctx = can.getContext('2d');
        ctx.lineWidth = 30;
        ctx.lineCap = ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,1)'; // can be any opaque color
        if (this.fresh) {
            ctx.beginPath();
            this.fresh = false;
            // this +0.01 hackishly causes Linux Chrome to draw a
            // "zero"-length line (a single point), otherwise it doesn't
            // draw when the mouse is clicked but not moved:
            ctx.moveTo(x + 0.01, y);
        }
        ctx.lineTo(x, y);
        ctx.stroke();

        // call back if we have it
        this.dispatchEvent(this.createEvent('scratch'));
    };

    /**
     * Set up the main canvas and listeners
     */
    Scratcher.prototype._setupCanvases = function () {
        var c = this.canvas.main;

        // create the temp and draw canvases, and set their dimensions
        // to the same as the main canvas:

        /**
         * On mouse move, if mouse down, draw a line
         *
         * We do this on the window to smoothly handle mousing outside
         * the canvas
         */
        function mousemove_handler(e) {
            if (!this.mouseDown) {
                return true;
            }
            var local = getLocalCoords(c, getEventCoords(e));

            this.scratchLine(local.x, local.y);

            return false;
        };


        $(document).on('mousemove', mousemove_handler.bind(this));
        $(document).on('touchmove', mousemove_handler.bind(this));
    };

    /**
     * Reset the scratcher
     *
     * Dispatches the 'reset' event.
     *
     */
    Scratcher.prototype.reset = function () {
        // clear the draw canvas
        this.fresh = true;
        this.recompositeCanvases();

        // call back if we have it
        this.dispatchEvent(this.createEvent('reset'));
    };

    /**
     * returns the main canvas jQuery object for this scratcher
     */
    Scratcher.prototype.mainCanvas = function () {
        return this.canvas.main;
    };

    /**
     * Handle loading of needed image resources
     *
     * Dispatches the 'imagesloaded' event
     */
    Scratcher.prototype._loadImages = function () {
        var loadCount = 0;

        // callback for when the images get loaded
        function imageLoaded(e) {
            loadCount++;

            if (loadCount >= 1) {
                // call the callback with this Scratcher as an argument:
                this.dispatchEvent(this.createEvent('imagesloaded'));
                this.recompositeCanvases();
            }
        }

        // load BG and FG images
        for (k in this.image) if (this.image.hasOwnProperty(k)) {
            this.image[k].img = document.createElement('img'); // image is global
            $(this.image[k].img).on('load', imageLoaded.bind(this));
            this.image[k].img.src = this.image[k].url;
        }
    };

    /**
     * Create an event
     *
     * Note: not at all a real DOM event
     */
    Scratcher.prototype.createEvent = function (type) {
        var ev = {
            'type': type,
            'target': this,
            'currentTarget': this
        };

        return ev;
    };

    /**
     * Add an event listener
     */
    Scratcher.prototype.addEventListener = function (type, handler) {
        var el = this._eventListeners;

        type = type.toLowerCase();

        if (!el.hasOwnProperty(type)) {
            el[type] = [];
        }

        if (el[type].indexOf(handler) == -1) {
            el[type].push(handler);
        }
    };

    /**
     * Remove an event listener
     */
    Scratcher.prototype.removeEventListener = function (type, handler) {
        var el = this._eventListeners;
        var i;

        type = type.toLowerCase();

        if (!el.hasOwnProperty(type)) {
            return;
        }

        if (handler) {
            if ((i = el[type].indexOf(handler)) != -1) {
                el[type].splice(i, 1);
            }
        } else {
            el[type] = [];
        }
    };

    /**
     * Dispatch an event
     */
    Scratcher.prototype.dispatchEvent = function (ev) {
        var el = this._eventListeners;
        var i, len;
        var type = ev.type.toLowerCase();

        if (!el.hasOwnProperty(type)) {
            return;
        }

        len = el[type].length;

        for (i = 0; i < len; i++) {
            el[type][i].call(this, ev);
        }
    };

    /**
     * Set up a bind if you don't have one
     *
     * Notably, Mobile Safari and the Android web browser are missing it.
     * IE8 doesn't have it, but <canvas> doesn't work there, anyway.
     *
     * From MDN:
     *
     * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind#Compatibility
     */
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== "function") {
                // closest thing possible to the ECMAScript 5 internal
                // IsCallable function
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                fNOP = function () {
                },
                fBound = function () {
                    return fToBind.apply(this instanceof fNOP
                        ? this
                        : oThis || window,
                        aArgs.concat(Array.prototype.slice.call(arguments)));
                };

            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();

            return fBound;
        };
    }

    return Scratcher;

})();


(function () {
    function supportsCanvas() {
        return !!document.createElement('canvas').getContext;
    }
    
    /**
     * Handle scratch event on a scratcher
     */
    function scratcherProgressHandler(ev) {
        // Test every pixel. Very accurate, but might be slow on large
        // canvases on underpowered devices:
        //var pct = (scratcher.fullAmount() * 100)|0;

        // Only test every 32nd pixel. 32x faster, but might lead to
        // inaccuracy:
        var pct = (this.fullAmount(32) * 100) | 0;
        if (pct < 3) {
            if (!$('.scratcher').hasClass('complete')) {
                $('.scratcher').addClass('complete');
                if (!$('#moment').hasClass('appear')) {
                    $('#moment').addClass('appear')
                }
            }
        }
    }

    function scratcherLoadingHandler(ev) {
        $('.scratcher').show();
    }

    /**
     * Assuming canvas works here, do all initial page setup
     */
    function initScratcher() {
        //	create new scratcher
        var scratcher = new Scratcher('fx-scratcher');

        scratcher.addEventListener('imagesloaded', scratcherLoadingHandler);
        // var scratcherImage = 'data:image/png;base64,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';
        //var scratcherImage = 'https://firefox.club.tw/static/img/event/every-moment/scratch/scratch-gray.png';
        var scratcherImage = 'foreground.png'
        scratcher.setImages(scratcherImage);

        scratcher.addEventListener('scratch', scratcherProgressHandler);
        $('#reset').click(function() {
            scratcher.reset();
            if ($('.scratcher').hasClass('complete')) {
                $('.scratcher').removeClass('complete');
                if ($('#moment').hasClass('appear')) {
                    $('#moment').removeClass('appear')
                }
            }
        });
    }

    $(function () {
        if (supportsCanvas()) {
            initScratcher();
        } else {
            $('#scratcher-box').hide();
            $('#lamebrowser').show();
        }
    });

})();
