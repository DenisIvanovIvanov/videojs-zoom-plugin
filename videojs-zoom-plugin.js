
class ZoomMenuButton extends videojs.getComponent('MenuButton') {
    constructor(player, options) {
        super(player, options);
    }

    createMenu() {
        var menu = new ZoomMenu(this.player(), this.options);
        var el = this.el().getElementsByClassName('vjs-icon-placeholder')[0];
        var span = document.createElement('span');
        span.classList.add('vjs-icon-cog', 'zoom-menu-button-icon');
        el.appendChild(span);
        return menu;
    }
}

class Slider extends videojs.getComponent('MenuItem') {
    constructor(player, opts) {
        super(player, opts);
    }

    createEl() {
        var liEl = document.createElement('li');
        liEl.classList.add('zoom-slider-parent');

        this.rangeInput = document.createElement('input');
        this.rangeInput.type = 'range';
        this.rangeInput.min = '100';
        this.rangeInput.max = '500';
        this.rangeInput.step = '1';
        this.rangeInput.id = `range-slider-${this.player().id()}`;
        this.rangeInput.classList.add('zoom-slider');
        liEl.appendChild(this.rangeInput);
        return liEl;
    }
}

class ResetZoomButton extends videojs.getComponent('MenuItem') {
    constructor(player, opts) {
        super(player, opts);
    }

    createEl() {
        var div = document.createElement('li');
        this.resetButton = document.createElement('button');
        this.resetButton.innerHTML = 'Reset';
        this.resetButton.classList.add('zoom-reset-button');
        div.appendChild(this.resetButton);

        return div;
    }
}

class ZoomContent extends videojs.getComponent('MenuItem') {
    constructor(player, opts) {
        super(player, opts);
    }

    createEl() {
        var liEl = document.createElement('li');
        this.zoomContent = document.createElement('p');
        this.zoomContent.classList.add('zoom-label');
        liEl.appendChild(this.zoomContent);
        return liEl;
    }

    onRangeUpdate(value) {
        this.zoomContent.innerHTML = `${value}%`;
    }
}

class ZoomMenu extends videojs.getComponent('Menu') {
    constructor(player, opts) {
        super(player, opts);

        var reset = new ResetZoomButton(player, opts);
        this.addChild(reset, {}, 0);
        var slider = new Slider(player, opts);
        this.addChild(slider, {}, 1);
        var rangeContent = new ZoomContent(player, opts);
        rangeContent.onRangeUpdate(slider.rangeInput.value);
        slider.rangeInput.addEventListener('input', () => {
            rangeContent.onRangeUpdate(slider.rangeInput.value);
            player.zoom.onSliderMove(slider.rangeInput.value);
        });
        reset.resetButton.onclick = function () {
            slider.rangeInput.value = '100';
            rangeContent.onRangeUpdate(slider.rangeInput.value);
            player.zoom.onSliderMove(slider.rangeInput.value);
        }
        this.addChild(rangeContent, {}, 2);
        let menuContent = this.el().getElementsByClassName('vjs-menu-content')[0];
        menuContent.style.minHeight = '18em';
    }
}

(function () {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let loopTimeout = null;
    let onMouseDownOffsets = null;
    let percentage = 100;

    function registerZoomPlugin(options) {
        const player = this;
        let settings = videojs.mergeOptions({}, options);

        player.zoom = {
            playerVideo: player.children()[0],
            framerate: options.framerate == 0 ? 1000 / 30 : options.framerate,
            onSliderMove: function (sliderPercentage) {
                if (sliderPercentage <= 100) {
                    this.dispose();
                } else {
                    percentage = sliderPercentage;
                    this.playerVideo.style.setProperty('pointer-events', 'none');
                    this.updateZoom();
                    this.preview();
                    player.on('mousedown', (e) => {
                        onMouseDownOffsets = [this.playerVideo.offsetLeft - e.clientX, this.playerVideo.offsetTop - e.clientY];
                        player.on('mousemove', (ev) => this.onMouseMove(ev.clientX, ev.clientY));
                    })
                    player.on('mouseup', (e) => {
                        player.off('mousemove');
                    });
                }
            },
            dispose: function () {
                player.off('mousedown');
                player.off('mousemove');
                if (canvas.parentNode == player.el())
                    player.el().removeChild(canvas);

                if (loopTimeout) {
                    clearTimeout(loopTimeout);
                    loopTimeout = null;
                }
                player.el().style.overflow = 'visible';
                this.playerVideo.style.removeProperty('pointer-events');
                this.playerVideo.style.transform = 'scale(1)';
                this.playerVideo.style.removeProperty('top');
                this.playerVideo.style.removeProperty('left');
            },
            preview: function () {
                canvas.style.top = 0;
                canvas.style.right = 0;
                canvas.style.position = 'absolute';
                canvas.style.border = '1px solid gray';
                this.configurePreviewScale();

                if (loopTimeout == null) {
                    loopTimeout = setTimeout(() => this.previewLoop(), this.frameRate);
                    player.el().appendChild(canvas);
                }
            },
            updateZoom: function () {
                player.el().style.overflow = 'hidden';
                let scale = percentage / 100;
                this.playerVideo.style.transform = `scale(${scale})`;
            },
            previewLoop: function () {
                const ratioX = canvas.width / this.playerVideo.videoWidth;
                const ratioY = canvas.height / this.playerVideo.videoHeight;
                const ratio = Math.min(ratioX, ratioY);

                ctx.drawImage(this.playerVideo, 0, 0, this.playerVideo.videoWidth * ratio, this.playerVideo.videoHeight * ratio);
                const normalizedPercentage = percentage / 100;
                const recWidth = ((this.playerVideo.videoWidth * ratio) / normalizedPercentage);
                const recHeight = ((this.playerVideo.videoHeight * ratio) / normalizedPercentage);
                const video = this.playerVideo.getBoundingClientRect();
                const parent = this.playerVideo.parentElement.getBoundingClientRect();
                const offsetRatioW = (this.playerVideo.videoWidth / 2) / video.width;
                const offsetRatioH = (this.playerVideo.videoHeight / 2) / video.height;
                let top = ((-(video.top - parent.top) * offsetRatioH) * ratio) * 2;
                let left = ((-(video.left - parent.left) * offsetRatioW) * ratio) * 2;

                ctx.beginPath();
                ctx.strokeStyle = 'white';
                ctx.rect(left, top, recWidth, recHeight);
                ctx.stroke();

                loopTimeout = setTimeout(() => this.previewLoop(), this.frameRate);
            },
            configurePreviewScale: function () {
                canvas.width = parseInt(getComputedStyle(this.playerVideo).width) / 4;
                canvas.height = parseInt(getComputedStyle(this.playerVideo).height) / 4;
            },
            onMouseMove: function (clientX, clientY) {
                let top = clientX + onMouseDownOffsets[0];
                let left = clientY + onMouseDownOffsets[1];
                let normalizePercentage = percentage / 100;
                let maxOffsetWidth = this.playerVideo.offsetWidth / 2 * (normalizePercentage - 1);
                let maxOffsetHeight = this.playerVideo.offsetHeight / 2 * (normalizePercentage - 1);

                if (top > maxOffsetWidth)
                    top = maxOffsetWidth;

                if (top < (-1 * maxOffsetWidth))
                    top = -1 * maxOffsetWidth;

                if (left > maxOffsetHeight)
                    left = maxOffsetHeight;

                if (left < (-1 * maxOffsetHeight))
                    left = -1 * maxOffsetHeight;

                this.playerVideo.style.left = `${top}px`;
                this.playerVideo.style.top = `${left}px`;
            }
        }
        player.on('fullscreenchange', () => { player.zoom.configurePreviewScale() });
        player.on('loadedmetadata', () => {
            let menuButton = new ZoomMenuButton(player, settings);
            player.controlBar.addChild(menuButton, {}, player.controlBar.children().length - 2);
        });
    }

    videojs.registerPlugin('zoom', registerZoomPlugin);
})();

