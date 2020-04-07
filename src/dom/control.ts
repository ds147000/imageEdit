class control {
    public $el:Element
    constructor(config: appConfig) {
        this.$el = document.createElement('div')
        this.init(config) 
    }
    init(config: appConfig) {
        this.$el.setAttribute('class', 'control')
        this.$el.innerHTML = `
                            <span>取消</span>
                                <div class="icon">
                                    ${config.spin ? '<i class="spin"></i>' : ''}
                                    ${config.zoom ? '<i class="zoom"></i>' : ''}
                                </div>
                            <span>完成</span>`
    }
}

export { control }