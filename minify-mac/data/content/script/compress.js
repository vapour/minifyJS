window.addEventListener('app-ready', function (e) {
    var uglify = nodeRequire('uglify-js'),
        path = nodeRequire('path'),
        fs = nodeRequire('fs');

    var jsp = uglify.parser,
        pro = uglify.uglify;


    var util = {
        compress: function (data) {
            var ast = jsp.parse(data); // parse code and get the initial AST
            ast = pro.ast_mangle(ast); // get a new AST with mangled names
            ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
            return pro.gen_code(ast); // compressed code here
        },
        getMinFileName: function (file) {
            var dirname = path.dirname(file),
                arr = path.basename(file).split('.');

            arr.splice(arr.length - 1, 0, 'min');
            
            return path.resolve(dirname, arr.join('.'));
        }
    };

    function uglifyJS (options) {
        console.log(options.files);
        var count = 0, error = [], last = options.files.length - 1;

        if (last === -1) {
            options.end && options.end();
            return;
        }

        options.progress = options.progress || function () {};

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
            }, 80 * index);
        });
    }

    window.uglifyJS = uglifyJS;
});
