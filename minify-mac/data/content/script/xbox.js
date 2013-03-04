(function () {
    var zIndex = 999,
        tpl = [
            '<div class="overlay-wrapper">',
                '<div class="overlay-mask"></div>',
                '<div class="overlay-xbox"></div>',
            '</div>'
        ].join('');

    function Xbox(cfg) {
        this.cfg = cfg;
        this.wrapper = $(tpl);
        
        this.init();
    }
    Xbox.prototype = {
        init: function () {
            var self = this;
            document.body.appendChild(this.wrapper[0]);
            this.content = $('div.overlay-xbox', this.wrapper);
            this.setContent(this.cfg.content);

            $('div.overlay-mask', this.wrapper).click(function () {
                self.hide();
            });

            this.cfg.init && this.cfg.init.call(this);
        },
        setContent: function (html) {
            this.content.html(html);
            this._h = -(Math.max(this.content.outerHeight(), 50) + 10);
            this.content.css('top', this._h);
        },
        show: function () {
            this.wrapper.css('z-index', ++zIndex);
            this.wrapper.addClass('overlay-show');
            this.content.css('top', 0);
        },
        hide: function () {
            this.content.css('top', this._h);
            this.wrapper.removeClass('overlay-show');
        }
    };
    window.Xbox = Xbox;
})();
