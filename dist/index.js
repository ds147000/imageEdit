'use strict';

var APP_CONFIG = {
    width: 0,
    height: 0,
    output: 'base64',
    putImageType: 'image/png',
    quality: 1,
    cWidth: null,
    cHeight: null,
    cut: true,
    zoom: true,
    move: true,
    spin: true,
    control: true
};
var APP_CANVAS_1 = 'image';
var APP_CANVAS_2 = 'cover';
var APP_BOX = 'image-edit-js';

var zoom = /** @class */ (function () {
    function zoom() {
        this.operating = false;
        this.onChange = function (val) { };
        this.$el = document.createElement('div');
        this.$el.setAttribute('class', 'zoom-control');
        this.$el.innerHTML = "<div class=\"slider-back\"></div><div class=\"slider\"></div><div class=\"mask\" ></div>";
        this.$slider = this.$el.querySelector('.slider');
        this.$sliderBack = this.$el.querySelector('.slider-back');
        this.init();
    }
    zoom.prototype.init = function () {
        this.$el.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.$el.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.$el.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.$el.addEventListener('mouseout', this.onMouseUp.bind(this));
        this.$el.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.$el.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.$el.addEventListener('touchend', this.onTouchEnd.bind(this));
    };
    zoom.prototype.onMouseDown = function (e) {
        this.operating = true;
        var width = this.$el.offsetWidth / 2;
        var x = e.offsetX - width;
        this.changeSlider(width + x);
        this.changeValue(x / width);
    };
    zoom.prototype.onMouseMove = function (e) {
        if (this.operating === false) {
            return;
        }
        var width = this.$el.offsetWidth / 2;
        var x = e.offsetX - width;
        this.changeSlider(width + x);
        this.changeValue(x / width);
    };
    zoom.prototype.onMouseUp = function () {
        var _this = this;
        this.operating = false;
        this.timeCap = setTimeout(function () {
            _this.hide();
        }, 3000);
    };
    zoom.prototype.onTouchStart = function (e) {
        this.operating = true;
        var width = this.$el.offsetWidth / 2;
        var touch = e.touches[0];
        var x = touch.pageX - width;
        this.changeSlider(width + x);
        this.changeValue(x / width);
    };
    zoom.prototype.onTouchMove = function (e) {
        if (this.operating === false) {
            return;
        }
        var width = this.$el.offsetWidth / 2;
        var touch = e.touches[0];
        var x = touch.pageX - width;
        this.changeSlider(width + x);
        this.changeValue(x / width);
    };
    zoom.prototype.onTouchEnd = function (e) {
        var _this = this;
        this.operating = false;
        this.timeCap = setTimeout(function () {
            _this.hide();
        }, 3000);
    };
    zoom.prototype.changeSlider = function (x) {
        this.$slider.style.transform = "translate(" + x + "px, -50%)";
        this.$slider.style.left = '0px';
        this.$sliderBack.style.width = x + "px";
    };
    zoom.prototype.changeValue = function (val) {
        val = parseFloat((val + 1).toFixed(2));
        this.value = val;
        this.onChange(this.value);
    };
    zoom.prototype.show = function () {
        var _this = this;
        clearTimeout(this.timeCap);
        this.$el.style.display = 'block';
        this.timeCap = setTimeout(function () {
            _this.hide();
        }, 3000);
    };
    zoom.prototype.hide = function () {
        if (this.operating === true) {
            return;
        }
        this.$el.style.display = 'none';
    };
    return zoom;
}());

var control = /** @class */ (function () {
    function control(config) {
        this.setZoom = function (val) { };
        this.setSpin = function (val) { };
        /**失败回调 */
        this.onError = function (err) { };
        /**成功回调 */
        this.onSuccess = function (res) { };
        this.$el = document.createElement('div');
        this.init(config);
    }
    control.prototype.init = function (config) {
        var _this = this;
        this.$el.setAttribute('class', 'control');
        this.$el.innerHTML = "\n                            <span class=\"error\" >\u53D6\u6D88</span>\n                                <div class=\"icon\">\n                                    " + (config.spin ? '<i class="spin"></i>' : '') + "\n                                    " + (config.zoom ? '<i class="zoom"></i>' : '') + "\n                                </div>\n                            <span class=\"ok\">\u5B8C\u6210</span>";
        this.$el.querySelector('.error').addEventListener('click', function () { return _this.onError(); });
        this.$el.querySelector('.ok').addEventListener('click', function () { return _this.onSuccess(); });
        config.zoom && this.initZoom();
        config.spin && this.initSpin();
    };
    control.prototype.initZoom = function () {
        var _this = this;
        this.$zoom = new zoom();
        this.$zoom.onChange = this.changeZoom.bind(this);
        this.$el.append(this.$zoom.$el);
        this.$el.querySelector('.zoom').addEventListener('click', function () {
            _this.$zoom.show();
        });
    };
    control.prototype.initSpin = function () {
        var _this = this;
        this.$spin = new zoom();
        this.$spin.onChange = this.changeSpin.bind(this);
        this.$el.append(this.$spin.$el);
        this.$el.querySelector('.spin').addEventListener('click', function () {
            _this.$spin.show();
        });
    };
    control.prototype.changeZoom = function (val) {
        this.setZoom(val);
    };
    control.prototype.changeSpin = function (val) {
        this.setSpin(val);
    };
    return control;
}());

/**
 * 判断位置是否被点击
 * @param x
 * @param y
 * @param rect
 */
var getPosition = function (x, y, x2, y2) {
    var ix = Math.abs(x2 - x);
    var iy = Math.abs(y2 - y);
    return ix < 25 && iy < 25;
};
var getMove = function (event, oldEvent) {
    return { x: event.offsetX - oldEvent.offsetX, y: event.offsetY - oldEvent.offsetY };
};
var getConterXY = function (x, y, x2, y2) {
    return { x: (x + x2) / 2, y: (y + y2) / 2 };
};
var getDistance = function (x, y, x2, y2) {
    return Math.sqrt((x - x2) * (x - x2) + (y - y2) * (y - y2));
};

var Scenes = /** @class */ (function () {
    function Scenes(config) {
        this.config = config;
        this.imageSize = { x: 0, y: 0, width: 0, height: 0, zoom: 1, rotate: 0 }; //背景图配置
        this.oldImageSize = { x: 0, y: 0, width: 0, height: 0, zoom: 1, rotate: 0 }; //旧背景图配置
        this.custCenter = []; // 自定义中心点
        /**失败回调 */
        this.onError = function (err) { };
        /**成功回调 */
        this.onSuccess = function (res) { };
        this.$el = document.createElement('div');
        this.$tips = document.createElement('dvi');
        this.init();
    }
    Scenes.prototype.init = function () {
        this.$el.setAttribute('class', APP_BOX);
        this.$el.style.width = this.config.width + 'px';
        this.$el.style.height = this.config.height + 'px';
        this.$tips.setAttribute('class', 'tips');
        this.$el.append(this.$tips);
        this.initCutSize();
        this.initImageCanvas();
        this.initCoverCanvas();
        this.initControl();
    };
    Scenes.prototype.initControl = function () {
        var _this = this;
        if (this.config.control) //开启控制器
            this.control = new control(this.config);
        this.control.setZoom = function (value) {
            _this.custCenter = [];
            _this.setZoom(value);
        };
        this.control.setSpin = function (value) {
            _this.custCenter = [];
            _this.setSpin(value);
        };
        this.control.onError = function () {
            _this.clear();
            _this.onError();
        };
        this.control.onSuccess = this.onOk.bind(this);
        this.$el.append(this.control.$el);
    };
    Scenes.prototype.initImageCanvas = function () {
        var canvas = document.createElement('canvas');
        canvas.setAttribute('class', APP_CANVAS_1);
        this.$el.append(canvas);
        canvas.width = this.config.cWidth;
        canvas.height = this.config.cHeight;
        this.ctx = canvas.getContext('2d');
    };
    Scenes.prototype.initCoverCanvas = function () {
        if (this.config.cut !== false) { // 编辑功能开启
            var canvas = document.createElement('canvas');
            canvas.setAttribute('class', APP_CANVAS_2);
            this.$el.append(canvas);
            canvas.width = this.config.cWidth;
            canvas.height = this.config.cHeight;
            this.scale = this.config.cWidth / this.config.width;
            this.coverCtx = canvas.getContext('2d');
            canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
            canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
            canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
            canvas.addEventListener('wheel', this.onWheel.bind(this));
            canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
            canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
            canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
        }
    };
    Scenes.prototype.onMouseDown = function (event) {
        this.isDownType(event.offsetX, event.offsetY);
        this.oldEvent = event;
        this.oldImageSize = Object.assign({}, this.imageSize);
    };
    Scenes.prototype.onMouseMove = function (event) {
        if (this.downType === 0) // 操作类型剪切框
            this.changeCut(event.offsetX, event.offsetY);
        // else // 操作类型为背景图
        else if (this.downType === 1) {
            var _a = getMove(event, this.oldEvent), x = _a.x, y = _a.y;
            this.moveImage(this.oldImageSize.x + x * this.scale, this.oldImageSize.y + y * this.scale);
        }
    };
    Scenes.prototype.onMouseUp = function (event) {
        this.downType = null;
        this.custCenter = [];
    };
    Scenes.prototype.onWheel = function (event) {
        this.setZoom(this.imageSize.zoom + (event.deltaY * 0.001));
    };
    Scenes.prototype.onTouchStart = function (event) {
        var topY = this.$el.getClientRects()[0].top;
        var touch = event.touches[0];
        this.isDownType(touch.pageX, touch.pageY - topY);
        this.oldTouchs = event.touches;
        this.oldImageSize = Object.assign({}, this.imageSize);
    };
    Scenes.prototype.onTouchMove = function (event) {
        event.preventDefault();
        if (event.touches.length === 1)
            this.onTouchMoveImage(event.touches[0]);
        else
            this.onTouchScale(event.touches);
    };
    Scenes.prototype.onTouchMoveImage = function (event) {
        var topY = this.$el.getClientRects()[0].top;
        if (this.downType === 0)
            this.changeCut(event.pageX, event.pageY - topY);
        else if (this.downType === 1) {
            var nowEvent = { offsetX: event.pageX, offsetY: event.pageY - topY };
            var oldEvent = { offsetX: this.oldTouchs[0].pageX, offsetY: this.oldTouchs[0].pageY - topY };
            var _a = getMove(nowEvent, oldEvent), x = _a.x, y = _a.y;
            this.moveImage(this.oldImageSize.x + x * this.scale, this.oldImageSize.y + y * this.scale);
        }
    };
    Scenes.prototype.onTouchScale = function (event) {
        var topY = this.$el.getClientRects()[0].top;
        // 获取中心点
        var touch_1 = this.oldTouchs[0];
        var touch_2 = this.oldTouchs[1];
        var new_touch_1 = event[0];
        var new_touch_2 = event[1];
        var _a = getConterXY(touch_1.pageX, touch_1.pageY - topY, touch_2.pageX, touch_2.pageY - topY), x = _a.x, y = _a.y;
        this.custCenter = [x * this.scale - this.oldImageSize.x / this.oldImageSize.zoom, y * this.scale - this.oldImageSize.y / this.oldImageSize.zoom];
        // 获取缩放比例
        var oldDistance = getDistance(touch_1.pageX, touch_1.pageY - topY, touch_2.pageX, touch_2.pageY - topY);
        var newDistance = getDistance(new_touch_1.pageX, new_touch_1.pageY - topY, new_touch_2.pageX, new_touch_2.pageY - topY);
        this.setZoom(this.oldImageSize.zoom * newDistance / oldDistance);
    };
    Scenes.prototype.onTouchEnd = function () {
        this.downType = null;
    };
    /**
     * 获取触摸的类型
     * @param event
     */
    Scenes.prototype.isDownType = function (x, y) {
        x = this.config.cWidth / this.config.width * x;
        y = this.config.cHeight / this.config.height * y;
        if (getPosition(x, y, this.cutSize.x, this.cutSize.y)) {
            // 操作的为剪切框
            this.downType = 0;
            this.cutNumber = 0;
        }
        else if (getPosition(x, y, this.cutSize.x + this.cutSize.width, this.cutSize.y)) {
            this.downType = 0;
            this.cutNumber = 1;
        }
        else if (getPosition(x, y, this.cutSize.x + this.cutSize.width, this.cutSize.y + this.cutSize.height)) {
            this.downType = 0;
            this.cutNumber = 2;
        }
        else if (getPosition(x, y, this.cutSize.x, this.cutSize.y + this.cutSize.height)) {
            this.downType = 0;
            this.cutNumber = 3;
        }
        else
            // 操作的为背景图
            this.downType = 1;
    };
    /**
     * 修改剪切框大小
     * @param x
     * @param y
     */
    Scenes.prototype.changeCut = function (x, y) {
        x *= this.scale;
        y *= this.scale;
        switch (this.cutNumber) {
            case 0:
                this.setCutSize(x, y, this.cutSize.x - x + this.cutSize.width, this.cutSize.y - y + this.cutSize.height);
                break;
            case 1:
                this.setCutSize(this.cutSize.x, y, x - this.cutSize.x, this.cutSize.y - y + this.cutSize.height);
                break;
            case 2:
                this.setCutSize(this.cutSize.x, this.cutSize.y, x - this.cutSize.x, y - this.cutSize.y);
                break;
            case 3:
                this.setCutSize(x, this.cutSize.y, this.cutSize.x - x + this.cutSize.width, y - this.cutSize.y);
                break;
        }
    };
    /**初始化剪切框 */
    Scenes.prototype.initCutSize = function () {
        var cutSize = (this.config.cWidth < this.config.cHeight ? this.config.cWidth : this.config.cHeight) * 0.7;
        this.cutSize = {
            width: cutSize,
            height: cutSize,
            x: (this.config.cWidth - cutSize) / 2,
            y: (this.config.cHeight - cutSize) / 2
        };
    };
    // 设置剪切框大小
    Scenes.prototype.setCutSize = function (x, y, width, height) {
        if (width < 50) {
            x = this.cutSize.x;
            width = 50;
        }
        if (height < 50) {
            y = this.cutSize.y;
            height = 50;
        }
        this.cutSize = {
            x: x,
            y: y,
            width: width,
            height: height
        };
        this.drawCutRect();
    };
    /**绘制剪切框 */
    Scenes.prototype.drawCutRect = function () {
        this.coverCtx.clearRect(0, 0, this.config.cWidth, this.config.cHeight);
        this.coverCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.coverCtx.fillRect(0, 0, this.config.cWidth, this.config.cHeight);
        this.coverCtx.clearRect(this.cutSize.x, this.cutSize.y, this.cutSize.width, this.cutSize.height);
        this.coverCtx.strokeStyle = 'rgba(255, 255, 255, 1)';
        this.coverCtx.lineWidth = 1;
        this.coverCtx.strokeRect(this.cutSize.x, this.cutSize.y, this.cutSize.width, this.cutSize.height);
        this.coverCtx.lineWidth = 4;
        // 左上角
        this.coverCtx.beginPath();
        this.coverCtx.moveTo(this.cutSize.x - 2, this.cutSize.y + 20);
        this.coverCtx.lineTo(this.cutSize.x - 2, this.cutSize.y - 2);
        this.coverCtx.lineTo(this.cutSize.x + 20, this.cutSize.y - 2);
        this.coverCtx.stroke();
        // 左下角
        this.coverCtx.beginPath();
        this.coverCtx.moveTo(this.cutSize.x - 2, this.cutSize.y + this.cutSize.height - 20);
        this.coverCtx.lineTo(this.cutSize.x - 2, this.cutSize.y + this.cutSize.height + 2);
        this.coverCtx.lineTo(this.cutSize.x + 20, this.cutSize.y + this.cutSize.height + 2);
        this.coverCtx.stroke();
        // 右下角
        this.coverCtx.beginPath();
        this.coverCtx.moveTo(this.cutSize.x + this.cutSize.width + 2, this.cutSize.y + this.cutSize.height - 22);
        this.coverCtx.lineTo(this.cutSize.x + this.cutSize.width + 2, this.cutSize.y + this.cutSize.height + 2);
        this.coverCtx.lineTo(this.cutSize.x + this.cutSize.width - 20, this.cutSize.y + this.cutSize.height + 2);
        this.coverCtx.stroke();
        // 右上角
        this.coverCtx.beginPath();
        this.coverCtx.moveTo(this.cutSize.x + this.cutSize.width - 20, this.cutSize.y - 2);
        this.coverCtx.lineTo(this.cutSize.x + this.cutSize.width + 2, this.cutSize.y - 2);
        this.coverCtx.lineTo(this.cutSize.x + this.cutSize.width + 2, this.cutSize.y + 22);
        this.coverCtx.stroke();
    };
    /**
     * 移动图像
     * @param x
     * @param y
     */
    Scenes.prototype.moveImage = function (x, y) {
        this.imageSize.x = x;
        this.imageSize.y = y;
        this.resDrwaImage();
    };
    /**缩放背景图 */
    Scenes.prototype.setZoom = function (value) {
        this.imageSize.zoom = value;
        this.resDrwaImage();
        this.showTips((value * 100).toFixed(0) + "%");
    };
    // 旋转背景
    Scenes.prototype.setSpin = function (value) {
        this.setRoate(value * 360 - 360);
    };
    Scenes.prototype.setRoate = function (rotate) {
        this.showTips((rotate).toFixed(1) + "%");
        this.imageSize.rotate = rotate;
        this.resDrwaImage();
    };
    /**重绘图像 */
    Scenes.prototype.resDrwaImage = function () {
        // 重置h画布
        this.clear();
        // 配置
        if (this.imageSize.zoom !== 1 || this.imageSize.rotate !== 0) { // 存在旋转和放大
            var imageRadiusWideh = this.custCenter.length > 0 ? this.custCenter[0] : this.imageSize.width / 2;
            var imageRadiusHeight = this.custCenter.length > 0 ? this.custCenter[1] : this.imageSize.height / 2;
            var imageMoveX = this.imageSize.x;
            var imageMoveY = this.imageSize.y;
            // 位移操作点
            this.ctx.translate(imageMoveX, imageMoveY);
            // 设置中心点
            this.ctx.translate(imageRadiusWideh, imageRadiusHeight);
            // 旋转
            this.ctx.rotate(this.imageSize.rotate * Math.PI / 180);
            // 放大
            this.ctx.scale(this.imageSize.zoom, this.imageSize.zoom);
            // 恢复中心点
            this.ctx.translate(-imageRadiusWideh, -imageRadiusHeight);
            // 渲染
            this.ctx.drawImage(this.imageBitmap, 0, 0, this.imageSize.width, this.imageSize.height);
        }
        else {
            this.ctx.drawImage(this.imageBitmap, this.imageSize.x, this.imageSize.y, this.imageSize.width, this.imageSize.height);
        }
    };
    /**显示提示 */
    Scenes.prototype.showTips = function (str) {
        var _this = this;
        clearTimeout(this.tipsCal);
        this.$tips.innerText = str;
        this.$tips.style.display = 'block';
        this.tipsCal = setTimeout(function () {
            _this.$tips.style.display = 'none';
        }, 1500);
    };
    /**重置 */
    Scenes.prototype.restart = function () {
        this.getImageSize(this.imageBitmap);
        this.resDrwaImage();
    };
    Scenes.prototype.clear = function () {
        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.config.cWidth, this.config.cHeight);
    };
    Scenes.prototype.enterImage = function (file) {
        var _this = this;
        if (typeof file === 'string' && /^(\.\/)|^(\.\.\/)|^(\/)/.test(file))
            file = file;
        else if (typeof file === 'string' && file.indexOf('http') === 0)
            file = file;
        else if (typeof file === 'string')
            file = URL.createObjectURL(file);
        else if (typeof file === 'object')
            file = URL.createObjectURL(file);
        else {
            console.error(new Error('输入对图片参数仅支持base64,Bolb,httpUrl类型'));
        }
        var img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function () {
            if (window.createImageBitmap) {
                createImageBitmap(img)
                    .then(function (res) {
                    _this.drwaImage(res);
                });
            }
            else {
                _this.drwaImage(img);
            }
        };
        img.src = file;
        this.drawCutRect();
    };
    Scenes.prototype.drwaImage = function (img) {
        this.imageBitmap = img;
        this.getImageSize(img);
        this.ctx.resetTransform();
        this.ctx.drawImage(this.imageBitmap, this.imageSize.x, this.imageSize.y, this.imageSize.width, this.imageSize.height);
    };
    /**计算图片宽高与垂直距离 */
    Scenes.prototype.getImageSize = function (img) {
        var scale = this.config.cWidth / img.width;
        this.imageSize.width = img.width * scale;
        this.imageSize.height = img.height * scale;
        this.imageSize.x = 0;
        this.imageSize.y = (this.config.cHeight - this.imageSize.height) / 2;
        this.imageSize.zoom = 1;
        this.imageSize.rotate = 0;
    };
    /**获取base64 */
    Scenes.prototype.getDataURL = function () {
        var ImageData = this.ctx.getImageData(this.cutSize.x, this.cutSize.y, this.cutSize.width, this.cutSize.height);
        var canvas = document.createElement('canvas');
        canvas.width = ImageData.width;
        canvas.height = ImageData.height;
        var ctx = canvas.getContext('2d');
        ctx.putImageData(ImageData, 0, 0);
        var result = canvas.toDataURL(this.config.putImageType, this.config.quality);
        ctx = null;
        canvas = null;
        ImageData = null;
        return result;
    };
    /**获取Bolb类型 */
    Scenes.prototype.getBolb = function (callbak) {
        var ImageData = this.ctx.getImageData(this.cutSize.x, this.cutSize.y, this.cutSize.width, this.cutSize.height);
        var canvas = document.createElement('canvas');
        canvas.width = ImageData.width;
        canvas.height = ImageData.height;
        var ctx = canvas.getContext('2d');
        ctx.putImageData(ImageData, 0, 0);
        canvas.toBlob(function (res) {
            ctx = null;
            canvas = null;
            ImageData = null;
            callbak(res);
        }, this.config.putImageType, this.config.quality);
    };
    // 完成
    Scenes.prototype.onOk = function () {
        var _this = this;
        switch (this.config.output) {
            case 'base64':
                this.onSuccess(this.getDataURL());
                break;
            case 'bolb':
                this.getBolb(function (result) { return _this.onSuccess(result); });
                break;
        }
    };
    return Scenes;
}());

var App = /** @class */ (function () {
    function App(className, config) {
        var _this = this;
        /**失败回调 */
        this.onError = function (err) { };
        /**成功回调 */
        this.onSuccess = function (res) { };
        this.Config = APP_CONFIG;
        var body;
        if (className) {
            body = document.body.querySelector(className);
        }
        else {
            body = document.body;
        }
        this.Config = Object.assign(this.Config, { cHeight: body.scrollHeight, cWidth: body.scrollWidth, width: body.scrollWidth, height: body.scrollHeight }, config);
        this.Scenes = new Scenes(this.Config);
        this.Scenes.onSuccess = function (res) { return _this.onSuccess(res); };
        this.Scenes.onError = function (err) { return _this.onError(err); };
        body.append(this.Scenes.$el);
        this.mounted();
    }
    App.prototype.mounted = function () { };
    App.prototype.destroy = function () {
        var _this = this;
        Object.keys(this).forEach(function (e) {
            delete _this[e];
        });
    };
    /**重置图像大小和位置 */
    App.prototype.restart = function () {
        this.Scenes.restart();
    };
    // 清空画布
    App.prototype.clear = function () {
        this.Scenes.clear();
    };
    /**
     * 缩放图片
     * @param value
     */
    App.prototype.zoom = function (value) {
        this.Scenes.setZoom(value);
    };
    /**
     * 旋转图片
     * @param value
     */
    App.prototype.roate = function (value) {
        this.Scenes.setRoate(value);
    };
    /**
     * 移动图片
     * @param x
     * @param y
     */
    App.prototype.move = function (x, y) {
        this.Scenes.moveImage(x, y);
    };
    /**
     * 输入图片
     * @param fileUrl
     */
    App.prototype.enterImage = function (fileUrl) {
        this.Scenes.enterImage(fileUrl);
    };
    /**获取剪切图片base64 */
    App.prototype.getDataURL = function () {
        return this.Scenes.getDataURL();
    };
    /**获取剪切图片Bolb */
    App.prototype.getBolb = function () {
        var _this = this;
        return new Promise(function (res, rej) {
            _this.Scenes.getBolb(function (r) { return res(r); });
        });
    };
    /**
     * 获取剪切图片数据
     * @param callbask
     */
    App.prototype.getData = function (callbask) {
        return this.Config.output === 'base64' ? callbask(this.getDataURL()) : this.Scenes.getBolb(callbask);
    };
    return App;
}());

module.exports = App;
