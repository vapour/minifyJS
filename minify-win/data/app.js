var app = module.exports = require('appjs');

app.serveFilesFrom(__dirname + '/content');

var trayMenu = app.createMenu([{
    label:'Show',
    action:function(){
        window.frame.show();
    },
},{
    label:'Minimize',
    action:function(){
        window.frame.hide();
    }
},{
    label: '' //separator
},{
    label:'Exit',
    action:function(){
        window.close();
    }
}]);

var statusIcon = app.createStatusIcon({
    icon: './data/content/icons/16.png',
    tooltip: ' Minify JavaScript and CSS file',
    menu: trayMenu
});

var window = app.createWindow({
    width  : 640,
    height : 460,
    icons  : __dirname + '/content/icons'
});

/*
window.on('create', function(){
  console.log("Window Created");
  window.frame.show();
  window.frame.center();
});
*/


window.on('ready', function(){
    window.frame.show();
    window.frame.center();
    window.nodeRequire = require;
    window.nodeProcess = process;
    window.nodeModule = module;
    window.App = app;

    //window.frame.openDevTools();

    window.addEventListener('app-done', function (e) {
        console.log('app-done');
    });

    //window.dispatchEvent(new window.Event('app-ready'));
});
/*
window.on('close', function(){
    console.log("Window Closed");
});
*/
