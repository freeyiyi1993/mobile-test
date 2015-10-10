var fs = require('fs')
var path = require('path')
var express = require('express')
var app = express()
var os = require('os')
var IPAddr

app.set('port', (process.env.PORT || 3000))

app.use('/', express.static(path.join(__dirname, 'public')))


// 计算本地IP
for(var i=0; i < os.networkInterfaces().en0.length; i++){

    if(os.networkInterfaces().en0[i].family === 'IPv4'){
        IPAddr = os.networkInterfaces().en0[i].address
    }
}

// 自动打开浏览器
var child_process = require('child_process')
var cmd = 'open "http://' + IPAddr + ':' + app.get('port') + '/"'

child_process.exec(cmd, function(err, stdout, error){
    if(err) {
        console.log('error:' + error)
    } else {
        var url = 'http://' + IPAddr + ':' + app.get('port') + '/'
        console.log('Server started: ' + url)
    }
})