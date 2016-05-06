(function($){
    $.fn.scratcher = function(config){
        var $canvas = $(this),
            canvas = $canvas[0],
            context,
            maskImage = config.maskImage,
            threshold = config.threshold || false,
            lineWidth = config.lineWidth || 30,
            isSupportCanvas = canvas.getContext || false,
            C_WIDTH = 0,
            C_HEIGHT = 0,
            scratchArr = ['touchstart', 'touchmove', 'touchend']
            DPR = window.devicePixelRatio || 1;

        if (isSupportCanvas) {
            C_WIDTH = canvas.width = $canvas.width() * 2;
            C_HEIGHT = canvas.height = $canvas.height() * 2;
            context = canvas.getContext('2d');

            createMaskImage();
            setScratcherLine();

            $canvas.on(scratchArr[0], scratchStartHandler);
        }

        function createMaskImage () {
            var image = new Image();
            image.onload = function () {
                context.drawImage(image, 0, 0, C_WIDTH, C_HEIGHT);
                context.globalCompositeOperation = 'destination-out';
            }
            image.src = maskImage;
        }

        function setScratcherLine () {
            context.lineWidth = lineWidth;
            context.lineCap = context.lineJoin = 'round';
            context.strokeStyle = 'rgba(0,0,0,1)';
        }

        function scratcherProgress () {
            var pixels = context.getImageData(0, 0, C_WIDTH, C_HEIGHT);
            var pdata = pixels.data;
            var stride = Math.pow(DPR, 2) * 32;
            var l = pdata.length;
            var total = (l / stride);

            for (i = count = 0; i < l; i += stride) {
                if (pdata[i] != 0) {
                    count++;
                }
            }
            return count * 100 / total;
        }

        function scratchStartHandler (e) {
            var touch = e.touches[0];
            var x = touch.pageX * 2 - this.offsetLeft * 2;
            var y = touch.pageY * 2 - this.offsetTop * 2;

            context.moveTo(x, y);
            $canvas.on(scratchArr[1], scratchMoveHandler);

        }
        function scratchMoveHandler (e) {
            var touch = e.touches[0];
            var x = touch.pageX * 2 - this.offsetLeft * 2;
            var y = touch.pageY * 2 - this.offsetTop * 2;

            console.log(touch.pageX, touch.pageY, $(this).offset());
            context.lineTo(x, y);
            context.stroke();
            // 检测滑动区域 clearRect
            if (threshold && scratcherProgress() < threshold) {
                context.clearRect(0, 0, C_WIDTH, C_HEIGHT);
                $canvas.off(scratchArr[2]);
            }
        }

        function scratchEndHandler (e) {
            $canvas.off(scratchArr[2]);
        }


    }
})($);