
interface appConfig {
    output: String,
    width: number,
    height: number,
    cWidth: number,
    cHeight: number,
    cut: Boolean, // 是否开启剪切
    spin: Boolean, // 是否开启旋转
    zoom: Boolean, // 是否开启缩放
    move: Boolean, // 是否开启移动
    control: Boolean,
    putImageType: string,
    quality: number
}

// 编辑框参数
interface cutSize {
    width: number,
    height: number,
    x: number,
    y: number
}

interface imageSize {
    x: number,
    y: number,
    width: number,
    height: number,
    rotate: number,
    zoom: number
}