window.addEventListener('app-ready', function (e) {
    var fs = nodeRequire('fs'),
        path = nodeRequire('path'),
        cwd = nodeProcess.cwd();

    var tplFile = {
        default: function (obj) {
            return '<li><span class="file">' + obj.name + '</span></li>';
        },
        directory: function (obj) {
            return '<li class="file-item-directory"><a class="file" href="' + obj.path + '" data-action="cd-directory">' + obj.name + '</a></li>';
        },
        devFile: function (obj) {
            return '<li><span class="file">' + obj.name + '</span><input type="checkbox" class="chk" data-action="checkbox" value="' + obj.path + '" />';
        }
    };

    var xboxCompress = new Xbox({
        content: [
            '<div class="xbox-compress">',
                '<form id="fmCompressConfig">',
                    '<dl>',
                        '<dt>JS压缩引擎</dt>',
                        '<dd>',
                            '<label for="gcc" class="group-lb"><input type="radio" name="engine" id="gcc" value="gcc" checked="checked" />Google Closure Compiler</label>',
                            '<label for="yui" class="group-lb"><input type="radio" name="engine" id="yui" value="yui-js" />YUI Compressor</label>',
                            '<label for="uglify" class="group-lb"><input type="radio" name="engine" id="uglify" value="uglifyjs" />UglifyJS</label>',
                            '<label for="uglify2" class="group-lb"><input type="radio" name="engine" id="uglify2" value="uglifyjs2" />UglifyJS2</label>',
                        '</dd>',
                        '<dt>JS输出</dt>',
                        '<dd class="flex-wrapper">',
                            '<div class="flex-item"><label class="group-lb" for="jsOutputDirectory">目录<input type="text" id="jsOutputDirectory" value="../dist/" /></label><button id="jsSelectDirectory" type="button" class="btn btn-mini">浏览</button></div>',
                            '<div class="flex-item"><label class="group-lb" for="jsSuffix">文件名<input type="text" id="jsSuffix" /></label></div>',
                        '</dd>',
                        '<dt>CSS输出</dt>',
                        '<dd>',
                            '<label class="group-lb" for="cssSuffix">文件名<input type="text" id="cssSuffix" value="-min" /></label>',
                        '</dd>',
                        '<dd><button id="btnCompress" class="btn" type="submit">压缩</button></dd>',
                    '</dl>',
                '</form>',
                '<p class="warn">注意：GCC和YUI依赖于java, 可以运行java -version检测是否已经安装java。<p>',
                '',
            '</div>'
        ].join(''),
        init: function () {
            var self = this,
                jsOutputDirectory = $('#jsOutputDirectory'),
                cssSuffix = $('#cssSuffix'),
                jsSuffix = $('#jsSuffix');
            
            $('#jsSelectDirectory').click(function (ev) {
                window.frame.openDialog({
                    type:'open', //save|open|font|color
                    initialValue: nodeProcess.env.HOME,
                    //acceptTypes: { Images:['*.png','*.jpg'] },
                    multiSelect:false,
                    dirSelect:true
                }, function (err, paths) {
                    if (err) {
                        console.log(err);
                    }
                    jsOutputDirectory.val(paths[0]);
                });
            });


            $('#fmCompressConfig').submit(function (ev) {
                ev.preventDefault();
                var engine = $(this.engine).filter(':checked').val(),
                    dirname = path.resolve(fileSystem.pwd, jsOutputDirectory.val().trim());

                xboxCompress.hide();
                progressBar.show();

                //ui block
                setTimeout(function () {
                    minifyJS({
                        engine: engine,
                        directory: dirname,
                        jsSuffix: jsSuffix.val().trim(),
                        cssSuffix: cssSuffix.val().trim(),
                        files: self._files,
                        progress: function (obj) {
                            progressBar.update(obj);
                        },
                        end: function () {
                            fileSystem.refresh();
                            //进度条100%后，再关闭
                            setTimeout(function () {
                                progressBar.hide();
                            }, 200);
                        }
                    });
                }, 100);
            });
        }
    });

    var progressBar = new Xbox({
        content: [
            '<div class="progress-wrapper">',
                '<progress id="progressBar" class="progress-bar" value="0" max="100"></progress>',
            '</div>'
        ].join(''),
        init: function () {
            var MAX = 100;
            var bar = $('#progressBar');
            
            //更新进度条
            this.update = function (obj) {
                var v = parseInt(MAX * (obj.index / obj.total), 10);
                bar.val(v);
            }
        }
    });

    var fileSystem = {
        init: function () {
            this.wrapper = $('#fileList');
            this.nav = $('#fileNavOther');
			this.pwd = this.getDirectory();
               
            this.bind();
			this.renderDisks();  
            this.render(this.pwd);
        },
        bind: function () {
            var self = this;
            
            this.wrapper.click(function (ev) {
                var target = $(ev.target), li, ipt,
                    action = target.attr('data-action');

                switch (action) {
                    case 'cd-directory':
                        ev.preventDefault();
                        ev.stopPropagation();
                        self.render(target.attr('href'));
                        break;
                    case 'checkbox':
                        ev.stopPropagation();
                        break;
                    default:
                        if (target[0].tagName.toLowerCase() === 'li') {
                            li = target;
                        } else {
                            li = target.parents('li');
                        }
                        ipt = li.find('input.chk');
                        ipt.attr('checked', !ipt.attr('checked'));
                        break;
                }
            });

            this.nav.click(function (ev) {
                var dirname = ev.target.getAttribute('href');
                ev.preventDefault();

                fileSystem.render(dirname);
            });


            //support keyboard
            window.addEventListener('keyup', function (ev) {
                //console.log(ev);
            }, false);

            //bind compress event
            $('#navCompress').click(function () {
                var files = [];
                $('input.chk', self.wrapper).each(function (index, ipt) {
                    if (ipt.checked) {
                        files.push(ipt.value);
                    }
                });
                self.compressAll(files);
            });

            //bind select all
            $('#chkSelectAll').click(function () {
                var flag = this.checked;
                $('input.chk', self.wrapper).each(function (index, el) {
                    el.checked = flag;
                });
            });
        },
        compressAll: function (files) {
            xboxCompress.show();
            xboxCompress._files = files || [];
        },
        get: function (id) {
            return typeof id === 'string' ? document.getElementById(id) : id;
        },
        rebind: function () { //bind after render
            
        },
        refresh: function () {
            this.render(this.pwd);
        },
        render: function (dirname) {
            this.renderNav(dirname);
            this.renderList(dirname);
            this.setDirectory(dirname);
            $('#chkSelectAll')[0].checked = false;
        },
        renderList: function (dirname) { //render files list
            var self = this,
				reg = /[\u4e00-\u9fa5]/;
            fs.readdir(dirname, function (err, files) {
                var list = [], arrDir = [], arrFile = [];
                if (!err) {
                    //filter hidden file or directory, group by directory
                    files.forEach(function (fileName) {
                        if (self.isHidden(fileName)) return;
                        var _dir = path.resolve(dirname, fileName);
                        var _stat = fs.statSync(_dir);
						
						if (!_stat.isDirectory) {
							//这些文件会导致应用崩溃
							console.log(_dir);
							return;
						}
                        if (_stat.isDirectory()) {
                            arrDir.push({
                                name: fileName,
                                path: _dir,
                                directory: true
                            });
                        } else {
                            arrFile.push({
                                name: fileName,
                                path: _dir,
                                directory: false
                            });
                        }
                    });
					

                    //sort
                    arrDir.sort(function (a, b) {
                        return !self.compareByASCII(a.name, b.name);
                    });
                    arrFile.sort(function (a, b) {
                        return !self.compareByASCII(self.getBaseName(a.name), self.getBaseName(b.name));
                    });
                    
                    arrDir.concat(arrFile).forEach(function (obj) {
                        var name, ext;
                        if (obj.directory) {
                            name = 'directory';
                        } else {
                            ext = path.extname(obj.name);
                            switch (ext) {
                                case '.js':
                                case '.css':
                                    name = 'devFile';
                                    break;
                                default:
                                    name = 'default';
                                    break;
                            }
                        }
                        list.push(tplFile[name](obj));
                    });
                } else {
                    list.push('<li>出错了</li>');
                }
                list = list.join('');
                self.wrapper.html(list);
                self.rebind();
            });
            
        },
        renderNav: function (dirname) { //render nav
            var list = [], root = path.sep,
				arr = dirname.split(path.sep);
			
			arr.forEach(function (name, index) {
				var dir = arr.slice(0, index + 1).join(path.sep);

				if (index > 0 && name) {
					list.push('<a class="item" href="' + dir + '">' + name + '</a>');
				}
			});
			list = list.join('');
            
            this.nav.html(list);
        },
        compareByASCII: function (a, b) { //sort by ascii
            var ret;
            a = a.toLowerCase();
            b = b.toLowerCase();

            for (var i = 0, len = Math.min(a.length, b.length); i < len; i++) {
                if (a[i] !== b[i]) {
                    ret = a.charCodeAt(i) < b.charCodeAt(i);
                    break;
                }
            }

            if (ret === undefined) {
                ret = a.length < b.length;
            }

            return ret;
        },
        getBaseName: function (fileName) {
            var index = fileName.lastIndexOf('.');
            return fileName.slice(0, index);
        },
        isHidden: function (dirname) { //hidden file or directory
            var fileName = path.basename(dirname);
            return fileName.charAt(0) === '.';
        },
        getDirectory: function () { //get default directory
            var name = localStorage.getItem('lastDirectory');
            name = name || cwd;

            return name;
        },
        setDirectory: function (dirname) { //set directory
            this.pwd = dirname;
            localStorage.setItem('lastDirectory', dirname);
        },
		renderDisks: function () { //get window disk partition
			var str = 'cdefghijklmnopqrstuvwxyz'.toUpperCase().split(''),
				self = this,
				html = ['<select id="selectDisk">'];
			str.forEach(function (letter, index) {
				var disk = letter + ':';
				if (fs.existsSync(disk)) {
					html.push('<option value="' + disk + '">' + disk + '</option>');
				}
			});
			html.push('</select>');
			$('#fileNavDisk').html(html.join(''));
			
			$('#selectDisk').val(this.pwd.split(path.sep)[0]);
			$('#selectDisk').change(function () {
				console.log(this.value);
				self.render(this.value);
			});
		}
    };
    fileSystem.init();
});
