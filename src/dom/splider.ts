class zoom{
    $el: HTMLElement

    private $slider: HTMLElement

    private $sliderBack: HTMLElement

    private value: number

    private operating: Boolean = false

    private timeCap: any

    onChange: Function = (val) => {}

    constructor() {
        this.$el = document.createElement('div')
        this.$el.setAttribute('class', 'zoom-control')
        this.$el.innerHTML = `<div class="slider-back"></div><div class="slider"></div><div class="mask" ></div>`
        this.$slider = this.$el.querySelector('.slider')
        this.$sliderBack = this.$el.querySelector('.slider-back')

        this.init()
    }

    private init() {

        this.$el.addEventListener('mousedown', this.onMouseDown.bind(this))
        this.$el.addEventListener('mousemove', this.onMouseMove.bind(this))
        this.$el.addEventListener('mouseup', this.onMouseUp.bind(this))
        this.$el.addEventListener('mouseout', this.onMouseUp.bind(this))

        this.$el.addEventListener('touchstart', this.onTouchStart.bind(this))
        this.$el.addEventListener('touchmove', this.onTouchMove.bind(this))
        this.$el.addEventListener('touchend', this.onTouchEnd.bind(this))
    }

    private onMouseDown(e: MouseEvent) {
        this.operating = true

        const width = this.$el.offsetWidth / 2
        const x = e.offsetX - width
        this.changeSlider(width + x)
        this.changeValue(x / width)
    }

    private onMouseMove(e: MouseEvent) {
        if (this.operating === false) {
            return
        }

        const width = this.$el.offsetWidth / 2
        const x = e.offsetX - width
        this.changeSlider(width + x)
        this.changeValue(x / width)

    }

    private onMouseUp() {
        this.operating = false
        this.timeCap = setTimeout(() => {
            this.hide()
        }, 3000)
    }

    private onTouchStart(e: TouchEvent) {
        this.operating = true

        const width = this.$el.offsetWidth / 2
        const touch = e.touches[0]
        const x = touch.pageX - width
        this.changeSlider(width + x)
        this.changeValue(x / width)
    }

    private onTouchMove(e: TouchEvent) {
        if (this.operating === false) {
            return
        }

        const width = this.$el.offsetWidth / 2
        const touch = e.touches[0]
        const x = touch.pageX - width
        this.changeSlider(width + x)
        this.changeValue(x / width)

    }

    private onTouchEnd(e: TouchEvent) {
        this.operating = false
        this.timeCap = setTimeout(() => {
            this.hide()
        }, 3000)
    }

    private changeSlider(x: number) {

        this.$slider.style.transform = `translate(${x}px, -50%)`
        this.$slider.style.left = '0px'
        this.$sliderBack.style.width = `${x}px`
    }

    changeValue(val: number) {
        val = parseFloat((val + 1).toFixed(2))
        this.value = val
        this.onChange(this.value)
    }

    show() {
        clearTimeout(this.timeCap)
        this.$el.style.display = 'block'
        this.timeCap = setTimeout(() => {
            this.hide()
        }, 3000)
    }

    hide() {
        if (this.operating === true) {
            return
        }
        this.$el.style.display = 'none'
    }
}

export default zoom