import { Scenes } from "./dom/scenes"
import { APP_CONFIG } from './config'

class App {
    private Scenes: Scenes

    private Config: appConfig = APP_CONFIG

    constructor(className: string, config: appConfig) {
        let body:Element
        if (className) { 
            body = document.body.querySelector(className)
        } else { 
            body = document.body
        }

        this.Config = Object.assign(this.Config, {cHeight: body.scrollHeight, cWidth: body.scrollWidth, width: body.scrollWidth, height: body.scrollHeight}, config)
        
        this.Scenes = new Scenes(this.Config)

        body.append(this.Scenes.$el)
        this.mounted()
    }
    enterImage(fileUrl: string | Blob) {
        this.Scenes.enterImage(fileUrl)
    }
    mounted() {}

    destroy() {
        Object.keys(this).forEach(e => {
            delete this[e]
        })
    }
    
}

export {
    App
}
