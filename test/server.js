const http = require('http')
const fs = require('fs')
const path = require('path')

const server = http.createServer((req, res) => {
    let url = req.url
    url = url === '/' ? './dome.html' : '../' + url
    fs.readFile(path.join(__dirname, url), ((err, data) => {
        if (err) {
            res.statusCode = 404
            res.end()
            return
        }
        if (url.indexOf('html') !== -1) {
            res.setHeader('Content-Type', 'text/html;charset=utf-8')
        }
        res.statusCode = 200
        res.end(data)
    }))
})

server.listen(8083,'192.168.1.7', () => {
    console.log('启动成功')
})