;
(function ($, window) {
    'use strict';

    $.fn.scratcher = function (options) {
        // 基本配置
        var me = this,
            isSupportCanvas = !!document.createElement('canvas').getContext,
            $canvas = $('<canvas class="scratcher"></canvas>'),
            canvas,// 有滑动事件的canvas
            context,
            CWIDTH = me.width(),
            CHEIGHT = me.height(),
            EventArr = ('ontouchstart' in window) ? ['touchstart', 'touchmove', 'touchend'] : ['mousedown', 'mousemove', 'mouseup'],
            DPR = window.devicePixelRatio || 1,

            settings = $.extend({
                threshold: 40, // 刮掉60的时候显示底图
                lineWidth: 45, // 线宽
            }, options);

        function initCanvas () {
            me.css({
                position: 'relative'
            })
            if (isSupportCanvas) {
                me.append($canvas);
                canvas = $canvas[0];

                context = canvas.getContext("2d");
                // 解决模糊问题
                $canvas.css({
                    width: CWIDTH,
                    height: CHEIGHT,
                    position: 'absolute'
                })
                canvas.width = CWIDTH * DPR;
                canvas.height = CHEIGHT * DPR;
            }
            // else 呢? todo
        }

        function drawImage (src, compositeType) {
            if (src) {
                var image = new Image();
                image.onload = function () {
                    context.globalCompositeOperation = 'source-over';
                    context.drawImage(image, 0, 0, canvas.width, canvas.height);
                    context.globalCompositeOperation = compositeType;
                }
                image.src = src;
            }

        }

        function initImage (options) {
            // 如果有背景图，绘制两个canvas
            drawImage(options.backImage, 'source-over');
            drawImage(options.maskImage, 'destination-out');// , options.opacity 这里用半透明图片代替 todo
        }

        function initPen (options) {
            // 设置scracherLine
            context.lineWidth = options.lineWidth;
            context.lineCap = context.lineJoin = 'round';
            context.strokeStyle = 'rgba(0, 0, 0, 1)';
        }

        function getCoord(e) {
            var touch = (EventArr[0].indexOf('touch') > -1) ? e.touches[0] : e,
                offset = e.currentTarget.getBoundingClientRect(),
                x,
                y;
            // 调整位置
            x =  (touch.pageX - offset.left) * DPR;
            y =  (touch.pageY - offset.top) * DPR;
            return {
                x: x,
                y: y
            }
        }

        function startScratch (e) {
            var startXY = getCoord(e);

            context.moveTo(startXY.x, startXY.y);
            // console.log(x * DPR, y * DPR);
            $canvas.on(EventArr[1], moveScratch);
        }

        function moveScratch (e) {// 传参数 位置 todo
            var startXY = getCoord(e);

            context.lineTo(startXY.x, startXY.y);
            context.stroke();
            // 检测滑动区域 clearRect
            if (scratcherProgress() < options.threshold) {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.canvas.onmousemove = null;
                return;
            }
        }

        function endScratch (e) {
            $canvas.off(EventArr[1]);
            // off 事件
            // context.canvas.onmouseup = function (e) {
            //     context.canvas.onmousemove = null;
            // }
        }

        /**
         * 检测刮去的比例
         * @return {比例}
         */
        function scratcherProgress () {
            var pixels = context.getImageData(0, 0, canvas.width, canvas.height);
            var pdata = pixels.data;
            var stride = Math.pow(DPR, 2) * 32;
            var l = pdata.length;
            var total = (l / stride);
            var i, count;

            for (i = count = 0; i < l; i += stride) {
                if (pdata[i] != 0) {
                    count++;
                }
            }
            return count*100 / total;
        }

        function bindEvent (options) {
            // 初始化画笔
            initPen(options);
            $canvas.on(EventArr[0], startScratch);
            $canvas.on(EventArr[2], endScratch);
            // 判定绑定正确的事件
        }

        function init () {// 这里没传options怎么也可以呢 todo
            // append canvas 设置canvas宽高
            initCanvas();
            // 绘制图片 如果有底图设置底图，没有底图 绘制maskImage 没有 maskImage 绘制 灰色蒙层
            initImage(options);
            // 添加事件
            bindEvent(options);
        }

        init();

    };
})(Zepto, window);
