/**
 * 判断位置是否被点击
 * @param x 
 * @param y 
 * @param rect 
 */
export const getPosition = (x: number, y:number, x2: number, y2:number) => {
    let ix = Math.abs(x2 - x)
    let iy = Math.abs(y2 - y)
    return ix < 25 && iy < 25
}

export const getMove = (event: MouseEvent, oldEvent: MouseEvent) => {
    return { x: event.offsetX - oldEvent.offsetX, y: event.offsetY - oldEvent.offsetY }
}

export const getConterXY = (x:number, y:number, x2: number, y2:number) => {
    return { x: (x + x2) / 2, y: (y + y2) / 2 }
}

export const getDistance = (x: number, y: number , x2: number, y2: number) => {
    return Math.sqrt((x - x2) * (x - x2) + (y - y2) * (y - y2))
}