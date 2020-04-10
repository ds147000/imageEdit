import { APP_BOX, APP_CANVAS_1, APP_CANVAS_2 } from '../config/index'
import { control } from './control'
import { getPosition, getMove, getConterXY, getDistance }  from '../libs/index'

class Scenes {
    $el: HTMLElement //节点

    $tips: HTMLElement

    private tipsCal: any

    private ctx: CanvasRenderingContext2D

    private coverCtx: CanvasRenderingContext2D

    private control: control

    private oldEvent: MouseEvent

    private oldTouchs: TouchList

    private cutSize: cutSize //剪切框配置

    private imageSize: imageSize = { x: 0, y: 0, width: 0, height: 0, zoom: 1, rotate: 0 } //背景图配置

    private oldImageSize: imageSize  = { x: 0, y: 0, width: 0, height: 0, zoom: 1, rotate: 0 } //旧背景图配置

    private imageBitmap: ImageBitmap | HTMLImageElement //图片资源

    private scale: number //画布与实际div比例

    private custCenter: Array<number> = [] // 自定义中心点

    private downType: number // 0= 剪切框，1背景图, null离开

    private cutNumber: number //操作的剪切点

    /**失败回调 */
    onError: Function = err => {}
    
    /**成功回调 */
    onSuccess: Function = res => {}

    constructor(private config: appConfig) {

        this.$el = document.createElement('div')

        this.$tips = document.createElement('dvi')

        this.init()
    }

    private init() {

        this.$el.setAttribute('class', APP_BOX)
        this.$el.style.width = this.config.width + 'px'
        this.$el.style.height = this.config.height + 'px'
        this.$tips.setAttribute('class', 'tips')
        this.$el.append(this.$tips)

        this.initCutSize()
        this.initImageCanvas()
        this.initCoverCanvas()
        this.initControl()
    }

    private initControl() {
        if (this.config.control) //开启控制器
            this.control = new control(this.config)
            this.control.setZoom = value => {
                this.custCenter = []
                this.setZoom(value)
            }
            this.control.setSpin = value => {
                this.custCenter = []
                this.setSpin(value)
            }
            this.control.onError = () => {
                this.clear()
                this.onError()
            }
            this.control.onSuccess = this.onOk.bind(this)

            this.$el.append(this.control.$el)
    }

    private initImageCanvas() {
        const canvas = document.createElement('canvas')
        canvas.setAttribute('class', APP_CANVAS_1)
        this.$el.append(canvas)

        canvas.width = this.config.cWidth
        canvas.height = this.config.cHeight
        this.ctx = canvas.getContext('2d')
    }

    private initCoverCanvas() {
        if (this.config.cut !== false) { // 编辑功能开启
            const canvas = document.createElement('canvas')
            canvas.setAttribute('class', APP_CANVAS_2)
            this.$el.append(canvas)
            
            canvas.width = this.config.cWidth
            canvas.height = this.config.cHeight
            this.scale = this.config.cWidth / this.config.width
            this.coverCtx = canvas.getContext('2d')

            canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
            canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
            canvas.addEventListener('mouseup', this.onMouseUp.bind(this))
            canvas.addEventListener('wheel', this.onWheel.bind(this))

            canvas.addEventListener('touchstart', this.onTouchStart.bind(this))
            canvas.addEventListener('touchmove', this.onTouchMove.bind(this))
            canvas.addEventListener('touchend', this.onTouchEnd.bind(this))
        }
    }

    onMouseDown(event:MouseEvent) {
        this.isDownType(event.offsetX, event.offsetY)
        this.oldEvent = event
        this.oldImageSize = Object.assign({}, this.imageSize)
    }

    onMouseMove(event: MouseEvent) {
        if (this.downType === 0) // 操作类型剪切框
            this.changeCut(event.offsetX, event.offsetY)
        // else // 操作类型为背景图
        else if (this.downType === 1) {
            const { x, y } = getMove(event, this.oldEvent)
            this.moveImage(this.oldImageSize.x + x * this.scale, this.oldImageSize.y + y * this.scale)
        }
    }

    onMouseUp(event: MouseEvent) {
        this.downType = null
        this.custCenter = []
    }

    onWheel(event: WheelEvent) {
        this.setZoom(this.imageSize.zoom + (event.deltaY * 0.001))
    }

    onTouchStart(event: TouchEvent) {
        const topY = this.$el.getClientRects()[0].top
        const touch: Touch = event.touches[0]
        this.isDownType(touch.pageX, touch.pageY - topY)
        this.oldTouchs = event.touches
        this.oldImageSize = Object.assign({}, this.imageSize)
    }

    onTouchMove(event: TouchEvent) {
        event.preventDefault()
        if (event.touches.length === 1) 
            this.onTouchMoveImage(event.touches[0])
        else 
            this.onTouchScale(event.touches)
    }

    onTouchMoveImage(event: Touch) {
        const topY = this.$el.getClientRects()[0].top

        if (this.downType === 0) 
            this.changeCut(event.pageX, event.pageY - topY)

        else if (this.downType === 1) {
            const nowEvent = { offsetX: event.pageX, offsetY: event.pageY - topY }
            const oldEvent = { offsetX: this.oldTouchs[0].pageX, offsetY: this.oldTouchs[0].pageY - topY }
            const { x, y } = getMove(nowEvent as MouseEvent, oldEvent as MouseEvent)
            
            this.moveImage(this.oldImageSize.x + x * this.scale, this.oldImageSize.y + y * this.scale)
        }
    }

    onTouchScale(event: TouchList) {
        const topY = this.$el.getClientRects()[0].top
        
        // 获取中心点
        const touch_1: Touch = this.oldTouchs[0]
        const touch_2: Touch = this.oldTouchs[1]
        const new_touch_1: Touch = event[0]
        const new_touch_2: Touch = event[1]

        const { x, y } = getConterXY(
                                        touch_1.pageX,
                                        touch_1.pageY - topY,
                                        touch_2.pageX,
                                        touch_2.pageY - topY
                                    )

        this.custCenter = [ x * this.scale - this.oldImageSize.x / this.oldImageSize.zoom, y * this.scale - this.oldImageSize.y / this.oldImageSize.zoom ]
        
        // 获取缩放比例
        const oldDistance = getDistance(touch_1.pageX, touch_1.pageY - topY, touch_2.pageX, touch_2.pageY - topY)
        const newDistance = getDistance(new_touch_1.pageX, new_touch_1.pageY - topY, new_touch_2.pageX, new_touch_2.pageY - topY)

        this.setZoom(this.oldImageSize.zoom * newDistance / oldDistance)
    }

    onTouchEnd() {
        this.downType = null
    }
    /**
     * 获取触摸的类型
     * @param event 
     */
    isDownType(x: number, y: number) {
        x = this.config.cWidth / this.config.width * x
        y = this.config.cHeight / this.config.height * y
        if (getPosition(x, y, this.cutSize.x, this.cutSize.y)) {
            // 操作的为剪切框
            this.downType = 0
            this.cutNumber = 0
        }
        else if (getPosition(x, y, this.cutSize.x + this.cutSize.width, this.cutSize.y)) {
            this.downType = 0
            this.cutNumber = 1
        }
        else if (getPosition(x, y, this.cutSize.x + this.cutSize.width, this.cutSize.y + this.cutSize.height)) {
            this.downType = 0
            this.cutNumber = 2
        } else if (getPosition(x, y, this.cutSize.x, this.cutSize.y + this.cutSize.height)) { 
            this.downType = 0
            this.cutNumber = 3
        } else
            // 操作的为背景图
            this.downType = 1
            
    }
    /**
     * 修改剪切框大小
     * @param x 
     * @param y 
     */
    changeCut(x: number, y:number) {
        x *= this.scale
        y *= this.scale
        switch(this.cutNumber) {
            case 0:
                this.setCutSize(x, y, this.cutSize.x - x + this.cutSize.width, this.cutSize.y - y + this.cutSize.height)
            break
            case 1:
                this.setCutSize(this.cutSize.x, y, x - this.cutSize.x, this.cutSize.y - y + this.cutSize.height)
            break
            case 2:
                this.setCutSize(this.cutSize.x, this.cutSize.y, x - this.cutSize.x, y - this.cutSize.y)
            break
            case 3:
                this.setCutSize(x, this.cutSize.y, this.cutSize.x - x + this.cutSize.width, y - this.cutSize.y)
            break
        }
    }
    /**初始化剪切框 */
    initCutSize() {
        const cutSize = (this.config.cWidth < this.config.cHeight ? this.config.cWidth : this.config.cHeight) * 0.7
        this.cutSize = {
            width: cutSize,
            height: cutSize,
            x: (this.config.cWidth - cutSize) / 2,
            y: (this.config.cHeight - cutSize) / 2
        }
    }
    // 设置剪切框大小
    setCutSize(x: number, y: number, width: number, height: number) {
        if (width < 50) {
            x = this.cutSize.x
            width = 50
        }
        if (height < 50) {
            y = this.cutSize.y
            height = 50
        }
        this.cutSize = {
            x,
            y,
            width,
            height
        }
        this.drawCutRect()
    }
    /**绘制剪切框 */
    drawCutRect() {
        this.coverCtx.clearRect(0, 0, this.config.cWidth, this.config.cHeight)

        this.coverCtx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        this.coverCtx.fillRect(0, 0, this.config.cWidth, this.config.cHeight)

        this.coverCtx.clearRect(this.cutSize.x, this.cutSize.y, this.cutSize.width, this.cutSize.height)

        this.coverCtx.strokeStyle = 'rgba(255, 255, 255, 1)'
        this.coverCtx.lineWidth = 1
        this.coverCtx.strokeRect(this.cutSize.x, this.cutSize.y, this.cutSize.width, this.cutSize.height)

        this.coverCtx.lineWidth = 4
        // 左上角
        this.coverCtx.beginPath()
        this.coverCtx.moveTo(this.cutSize.x - 2, this.cutSize.y + 20)
        this.coverCtx.lineTo(this.cutSize.x - 2, this.cutSize.y - 2)
        this.coverCtx.lineTo(this.cutSize.x + 20, this.cutSize.y - 2)
        this.coverCtx.stroke()

        // 左下角
        this.coverCtx.beginPath()
        this.coverCtx.moveTo(this.cutSize.x - 2, this.cutSize.y + this.cutSize.height - 20)
        this.coverCtx.lineTo(this.cutSize.x - 2, this.cutSize.y + this.cutSize.height + 2)
        this.coverCtx.lineTo(this.cutSize.x + 20, this.cutSize.y + this.cutSize.height + 2)
        this.coverCtx.stroke()

        // 右下角
        this.coverCtx.beginPath()
        this.coverCtx.moveTo(this.cutSize.x + this.cutSize.width + 2,  this.cutSize.y +  this.cutSize.height - 22)
        this.coverCtx.lineTo(this.cutSize.x + this.cutSize.width + 2,  this.cutSize.y +  this.cutSize.height +2)
        this.coverCtx.lineTo(this.cutSize.x + this.cutSize.width - 20,  this.cutSize.y +  this.cutSize.height +2)
        this.coverCtx.stroke()

        // 右上角
        this.coverCtx.beginPath()
        this.coverCtx.moveTo(this.cutSize.x + this.cutSize.width - 20,  this.cutSize.y - 2)
        this.coverCtx.lineTo(this.cutSize.x + this.cutSize.width + 2,  this.cutSize.y - 2)
        this.coverCtx.lineTo(this.cutSize.x + this.cutSize.width + 2,  this.cutSize.y + 22)
        this.coverCtx.stroke()
    }
    /**
     * 移动图像
     * @param x 
     * @param y 
     */
    moveImage(x:number, y: number) {
        this.imageSize.x = x
        this.imageSize.y = y
        this.resDrwaImage()
    }
    /**缩放背景图 */
    setZoom(value: number) {
        this.imageSize.zoom = value
        this.resDrwaImage()
        this.showTips(`${(value * 100).toFixed(0)}%`)
    }
    // 旋转背景
    setSpin(value: number) {
        this.setRoate(value * 360 - 360)
    }
    setRoate(rotate: number) {
        this.showTips(`${(rotate).toFixed(1)}%`)
        this.imageSize.rotate = rotate
        this.resDrwaImage()
    }
    /**重绘图像 */
    private resDrwaImage() {
        // 重置h画布
        this.clear()
        // 配置
        if (this.imageSize.zoom !== 1 || this.imageSize.rotate !== 0) { // 存在旋转和放大

            const imageRadiusWideh = this.custCenter.length > 0 ? this.custCenter[0] : this.imageSize.width / 2
            const imageRadiusHeight = this.custCenter.length > 0 ? this.custCenter[1] : this.imageSize.height / 2
            const imageMoveX = this.imageSize.x
            const imageMoveY = this.imageSize.y

            // 位移操作点
            this.ctx.translate(imageMoveX, imageMoveY)
            // 设置中心点
            this.ctx.translate(imageRadiusWideh, imageRadiusHeight)
            // 旋转
            this.ctx.rotate(this.imageSize.rotate * Math.PI / 180)
            // 放大
            this.ctx.scale(this.imageSize.zoom, this.imageSize.zoom)
            // 恢复中心点
            this.ctx.translate(-imageRadiusWideh, -imageRadiusHeight)

            // 渲染
            this.ctx.drawImage(this.imageBitmap, 0, 0, this.imageSize.width, this.imageSize.height)
        
        } else {
            this.ctx.drawImage(this.imageBitmap, this.imageSize.x, this.imageSize.y, this.imageSize.width, this.imageSize.height)
        }
    }
    /**显示提示 */
    private showTips(str: string) {
        clearTimeout(this.tipsCal)
        this.$tips.innerText = str
        this.$tips.style.display = 'block'

        this.tipsCal = setTimeout(() => {
            this.$tips.style.display = 'none'
        }, 1500)
    }
    /**重置 */
    restart() {
        this.getImageSize(this.imageBitmap)
        this.resDrwaImage()
    }
    clear() {
        this.ctx.resetTransform()
        this.ctx.clearRect(0, 0, this.config.cWidth, this.config.cHeight)
    }

    enterImage(file: string | Blob) {
        if (typeof file === 'string' && /^(\.\/)|^(\.\.\/)|^(\/)/.test(file))
            file = file
        else if (typeof file === 'string' && file.indexOf('http') === 0)
            file = file
        else if (typeof file === 'string') 
            file = URL.createObjectURL(file)
        else if (typeof file === 'object')
            file = URL.createObjectURL(file)
        else {
            console.error(new Error('输入对图片参数仅支持base64,Bolb,httpUrl类型'))
        }

        const img = new Image()
        img.crossOrigin = "Anonymous"

        img.onload = () => {
            if (window.createImageBitmap) {
                createImageBitmap(img)
                    .then(res => {
                        this.drwaImage(res)
                    })    
            } else {
                this.drwaImage(img)
            }
        }

        img.src = file

        this.drawCutRect()

    }

    drwaImage(img: HTMLImageElement | ImageBitmap) {
        this.imageBitmap = img
        this.getImageSize(img)
        this.ctx.resetTransform()
        this.ctx.drawImage(this.imageBitmap, this.imageSize.x, this.imageSize.y, this.imageSize.width, this.imageSize.height)
    }
    /**计算图片宽高与垂直距离 */
    private getImageSize(img: HTMLImageElement | ImageBitmap) {
        const scale = this.config.cWidth / img.width
        this.imageSize.width = img.width * scale
        this.imageSize.height = img.height * scale
        this.imageSize.x = 0
        this.imageSize.y = (this.config.cHeight - this.imageSize.height) / 2
        this.imageSize.zoom = 1
        this.imageSize.rotate = 0
    }
    /**获取base64 */
    getDataURL() {
        let ImageData = this.ctx.getImageData(this.cutSize.x, this.cutSize.y, this.cutSize.width, this.cutSize.height)
        let canvas = document.createElement('canvas')
        canvas.width = ImageData.width
        canvas.height = ImageData.height

        let ctx = canvas.getContext('2d')
        ctx.putImageData(ImageData, 0, 0)
        const result = canvas.toDataURL(this.config.putImageType, this.config.quality)

        ctx = null
        canvas = null
        ImageData = null

        return result
    }
    /**获取Bolb类型 */
    getBolb(callbak) {
        let ImageData = this.ctx.getImageData(this.cutSize.x, this.cutSize.y, this.cutSize.width, this.cutSize.height)
        let canvas = document.createElement('canvas')
        canvas.width = ImageData.width
        canvas.height = ImageData.height

        let ctx = canvas.getContext('2d')
        ctx.putImageData(ImageData, 0, 0)
        
        canvas.toBlob((res) => {
            ctx = null
            canvas = null
            ImageData = null
            callbak(res)
        }, this.config.putImageType, this.config.quality)
    }
    // 完成
    onOk() {
        switch(this.config.output) {
            case 'base64':
                this.onSuccess(this.getDataURL())      
            break
            case 'bolb':
                this.getBolb(result => this.onSuccess(result))
            break
        }
    }

}

export {
    Scenes
}