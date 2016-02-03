var fs = require('fs')
var path = require('path')
var express = require('express')
var app = express()
var os = require('os')
var IPAddr
var i = 0
// 模板
var substitute = function(str, data){
    return str.replace(/\{(\w+)\}/g, function(r, m){
        return data[m] !== undefined ? data[m] : '{' + m + '}';
    });
}
var template =
'<!DOCTYPE html>'+
'<html>'+
'<head>'+
'<meta charset="utf-8"/>'+
'<title>{title}</title>'+
'<style>.dir{background-color: red;}a:link,a:hover,a:visited{color:#00E;}</style>'+
'</head>'+
'<body>'+
'<h2>{path}</h2>'+
'{body}'+
'</body>'+
'</html>';

var models_path = __dirname + '/public'

var createIndex = function (path, content) {
  fs.writeFile(path + '/index.html', content, function(err) {
      if(err) {
          return console.log(err);
      }
  });
}
var re = /<title>(.*)<\/title>/
var title = ''

var walk = function(path) {
  var files = []
  fs
    .readdirSync(path)
    .forEach(function(file) {
      var newPath = path + '/' + file
      var stat = fs.statSync(newPath)
      if (stat.isFile() && file !== '.DS_Store' && file !== 'index.html') {
        // 读取title
        var str = fs.readFileSync(path + '/' + file, 'utf8')
        if (re.exec(str)) {
          title = re.exec(str)[1]
        }
        files.push('<li><a href="'+'./'+file+'">'+ file + ' | ' + title +'</a></li>')
      } else if (stat.isDirectory()) {
        files.push('<li class="dir"><a href="'+'./'+file+'">'+file+'</a></li>')
        walk(path + '/' + file)
      }
    })

  createIndex(path, substitute(template,{title:'List',path:path,body:'<ul>'+files.join('')+'</ul>'}))
}

walk(models_path)


app.set('port', (process.env.PORT || 3000))
app.use('/', express.static(path.join(__dirname, 'public')))

// 计算本地IP
while(os.networkInterfaces().en0[i].family !== 'IPv4'){i++ }
IPAddr = os.networkInterfaces().en0[i].address
// 打开浏览器
var child_process = require('child_process')
var cmd = 'open http://' + IPAddr + ':' + app.get('port') + '/'
// 监听端口 并给出提示信息
app.listen(app.get('port'), function() {
  child_process.exec(cmd, function(err, stdout, error){
    if(err) {
        console.log('error:' + error)
    } else {
        var url = 'http://' + IPAddr + ':' + app.get('port') + '/'
        console.log('Server started: ' + url)
    }
  })
})

// jsonp
app.all('*', function (req, res, next) {
    res
    .set({
        'Access-Control-Allow-origin': '*',
        'Access-Control-Allow-Headers': 'X-Requested-With',
        'Access-Control-Allow-Methods': 'GET'
    });
    next();
});
