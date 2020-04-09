import splider from "./splider"

class control {
    $el:Element

    setZoom: Function = val => {}

    setSpin: Function = val => {}

    /**失败回调 */
    onError: Function = err => {}
    
    /**成功回调 */
    onSuccess: Function = res => {}

    private $spin: splider

    private $zoom: splider

    constructor(config: appConfig) {
        this.$el = document.createElement('div')
        this.init(config) 
    }
    init(config: appConfig) {
        this.$el.setAttribute('class', 'control')
        this.$el.innerHTML = `
                            <span class="error" >取消</span>
                                <div class="icon">
                                    ${config.spin ? '<i class="spin"></i>' : ''}
                                    ${config.zoom ? '<i class="zoom"></i>' : ''}
                                </div>
                            <span class="ok">完成</span>`
        
        this.$el.querySelector('.error').addEventListener('click', () => this.onError() )
        this.$el.querySelector('.ok').addEventListener('click', () => this.onSuccess() )

        config.zoom && this.initZoom()
        config.spin && this.initSpin()
    }

    initZoom() {
        this.$zoom = new splider()
        this.$zoom.onChange = this.changeZoom.bind(this)
        this.$el.append(this.$zoom.$el)
        this.$el.querySelector('.zoom').addEventListener('click', () => {
            this.$zoom.show()
        })
    }

    initSpin() {
        this.$spin = new splider()
        this.$spin.onChange = this.changeSpin.bind(this)
        this.$el.append(this.$spin.$el)
        this.$el.querySelector('.spin').addEventListener('click', () => {
            this.$spin.show()
        })
    }

    changeZoom(val) {
        this.setZoom(val)
    }

    changeSpin(val) {
        this.setSpin(val)
    }
}

export { control }