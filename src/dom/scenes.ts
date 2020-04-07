import { APP_BOX, APP_CANVAS_1, APP_CANVAS_2 } from '../config/index'
import { control } from './control'
import { getPosition, getMove }  from '../libs/index'

class Scenes {
    public $el: HTMLElement //节点

    private ctx: CanvasRenderingContext2D

    private coverCtx: CanvasRenderingContext2D

    private control: control

    private oldEvent: MouseEvent

    private cutSize: cutSize //剪切框配置

    private imageSize: imageSize = { x: 0, y: 0, width: 0, height: 0, zoom: 1, rotate: 0 } //背景图配置

    private oldImageSize: imageSize  = { x: 0, y: 0, width: 0, height: 0, zoom: 1, rotate: 0 } //旧背景图配置

    private imageBitmap: ImageBitmap | HTMLImageElement //图片资源

    private scale: number //图片与画布的比例参考数

    private downType: number // 0= 剪切框，1背景图, null离开

    private cutNumber: number //操作的剪切点

    constructor(private config: appConfig) {
        
        let box = document.createElement('div')

        this.$el = box

        this.init()
    }

    private init() {
        this.$el.setAttribute('class', APP_BOX)
        this.$el.style.width = this.config.width + 'px'
        this.$el.style.height = this.config.height + 'px'
        this.initCutSize()
        this.initImageCanvas()
        this.initCoverCanvas()
        this.initControl()
    }

    private initControl() {
        if (this.config.control) //开启控制器
            this.control = new control(this.config)
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
            this.coverCtx = canvas.getContext('2d')

            canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
            canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
            canvas.addEventListener('mouseup', this.onMouseUp.bind(this))

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
            this.moveImage(this.oldImageSize.x + x, this.oldImageSize.y + y)
        }
    }

    onMouseUp(event: MouseEvent) {
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
        width = width < 50 ? 50 : width
        height = height < 50 ? 50 : height
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
            if (createImageBitmap) {
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
        this.ctx.drawImage(this.imageBitmap, this.imageSize.x, this.imageSize.y, this.imageSize.width, this.imageSize.height)
    }

    resDrwaImage() {
        this.ctx.clearRect(0, 0, this.config.cWidth, this.config.cHeight)
        this.ctx.drawImage(this.imageBitmap, this.imageSize.x, this.imageSize.y, this.imageSize.width, this.imageSize.height)
    }

    getImageSize(img: HTMLImageElement | ImageBitmap) {
        this.scale = this.config.cWidth / img.width
        this.imageSize.width = img.width * this.scale
        this.imageSize.height = img.height * this.scale
        this.imageSize.x = 0
        this.imageSize.y = (this.config.cHeight - this.imageSize.height) / 2
        this.imageSize.zoom = 1
        this.imageSize.rotate = 0
    }
}

export {
    Scenes
}