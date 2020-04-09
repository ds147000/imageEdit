import { Scenes } from "./dom/scenes"
import { APP_CONFIG } from './config'

class App {

    /**失败回调 */
    onError: Function = err => {}
    
    /**成功回调 */
    onSuccess: Function = res => {}

    private Scenes: Scenes

    private Config: appConfig = APP_CONFIG

    constructor(className: string, config: appConfig) {
        let body:Element
        if (className) { 
            body = document.body.querySelector(className)
        } else { 
            body = document.body
        }

        this.Config = Object.assign(this.Config, { cHeight: body.scrollHeight, cWidth: body.scrollWidth, width: body.scrollWidth, height: body.scrollHeight }, config)
        
        this.Scenes = new Scenes(this.Config)
        this.Scenes.onSuccess = res => this.onSuccess(res)
        this.Scenes.onError = err => this.onError(err)

        body.append(this.Scenes.$el)
        this.mounted()
    }
    mounted() {}
    destroy() {
        Object.keys(this).forEach(e => {
            delete this[e]
        })
    }
    /**重置图像大小和位置 */
    restart() {
        this.Scenes.restart()
    }
    // 清空画布
    clear() {
        this.Scenes.clear()
    }
    /**
     * 缩放图片
     * @param value  
     */
    zoom(value: number) {
        this.Scenes.setZoom(value)
    }
    /**
     * 旋转图片
     * @param value 
     */
    roate(value: number) {
        this.Scenes.setRoate(value)
    }
    /**
     * 移动图片
     * @param x 
     * @param y 
     */
    move(x: number, y: number) {
        this.Scenes.moveImage(x, y) 
    }
    /**
     * 输入图片
     * @param fileUrl 
     */
    enterImage(fileUrl: string | Blob) {
        this.Scenes.enterImage(fileUrl)
    }
    /**获取剪切图片base64 */
    getDataURL() {
        return this.Scenes.getDataURL()
    }
    /**获取剪切图片Bolb */
    getBolb() {
        return new Promise((res, rej) => {
            this.Scenes.getBolb(r => res(r))
        })
    }
    /**
     * 获取剪切图片数据
     * @param callbask 
     */
    getData(callbask: Function) {
        return this.Config.output === 'base64' ? callbask(this.getDataURL()) : this.Scenes.getBolb(callbask)
    }
    
}

export {
    App
}
