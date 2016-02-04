## Usage

引入:

```
<link rel="stylesheet" href="scratcher.css">
<script src="scratcher.js"></script>
```

DOM结构:

```html

<div class="scratcherContainer">
    <!-- 结果 可动态写入 -->
    <img src="/img/scratcher/background.png" alt="">
    <canvas class="scratcher"></canvas>
</div>
```

JS调用:

```js
var scratcher = new Scratcher({
    canvas: '.scratcher',
    maskImage: '/img/scratcher/foreground.png',
    threshold: 60,// 剩下区域小于多少时 maskImage全部消失
});
scratcher.start();
```
