/**
 * 判断位置是否被点击
 * @param x 
 * @param y 
 * @param rect 
 */
export const getPosition = (x: number, y:number, x2: number, y2:number) => {
    let ix = Math.abs(x2 - x)
    let iy = Math.abs(y2 - y)
    return ix < 10 && iy < 10
}

export const getMove = (event: MouseEvent, oldEvent: MouseEvent) => {
    return { x: event.offsetX - oldEvent.offsetX, y: event.offsetY - oldEvent.offsetY }
}