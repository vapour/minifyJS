window.addEventListener('app-ready', function (e) {
    var compressor = nodeRequire('node-minify'),
        path = nodeRequire('path'),
        fs = nodeRequire('fs');

    var util = {
        compress: function (data) {
        },
        getMinFileName: function (file, options) {
            var arr, extName = path.extname(file), fileName;

            if (extName == '.js') {
                arr = path.basename(file).split('.');
                extName = arr.pop();
                fileName = arr.join('.');
                return path.resolve(options.directory, fileName + options.jsSuffix + '.' + extName);
            } else {
                arr = file.split('.');
                extName = arr.pop();
                fileName = arr.join('.');
                return fileName + options.cssSuffix + '.' + extName;
            }
        },
        getEngine: function (file, options) {
            var ret,
                extName = path.extname(file);
            
            switch (extName) {
                case '.js':
                    ret = options.engine;
                    break;
                case '.css':
                    ret = 'yui-css';
                    break;
                default:
                    ret = options.engine;
                    console.log('extname error');
                    break;
            }
            return ret;
        }
    };

    function minify (options) {
        var count = 0, error = [], last = options.files.length - 1;

        if (last === -1) {
            options.end && options.end();
            return;
        }

        options.progress = options.progress || function () {};

        if (!fs.existsSync(options.directory)) {
            fs.mkdirSync(options.directory);
        }
        

        //进度条回调函数
        function handleProgress(file) {
            count++;
            options.progress({
                total: last + 1,
                file: file,
                index: count
            });
        }

        options.files.forEach(function (file, index) {
            /*
             * 防止UI阻塞，使进度条进度显示正常
             */
            setTimeout(function () {
                new compressor.minify({
                    type: util.getEngine(file, options),
                    fileIn: file,
                    fileOut: util.getMinFileName(file, options),
                    callback: function (err) {
                        if (err) {
                            console.log(err.message);
                            error.push(file);
                        }

                        handleProgress(file);
                        
                        if (index == last && options.end) {
                            options.end({
                                error: error
                            });
                        }
                    }
                });
                /*
                fs.readFile(file, 'utf-8', function (err, data) {
                    if (err) {
                        error.push(file);
                        handleProgress(file);
                        return;
                    }
                    
                    var minName = util.getMinFileName(file);
                    data = util.compress(data);
                    fs.writeFile(minName, data, function (err) {
                        handleProgress(file);
                        if (err) {
                            error.push(file);
                            return;
                        }
                        
                        if (index == last && options.end) {
                            options.end({
                                error: error
                            });
                        }
                    });

                });
                */
            }, 80 * index);
        });
    }

    window.minifyJS = minify;
});
