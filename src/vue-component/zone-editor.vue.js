const {xrx, goog} = require('semtonotes-client')
const XrxUtils = require('../xrx-utils')
const jQuery = require('jquery')

module.exports = {

    template: require('./zone-editor.vue.html'),

    components: {
        'bootstrap-button': require('./bootstrap-button.vue')
    },

    props: {
        annotation: {type: Object, required: true},
        targetImage: {type: String, required: true},
        l10n: {type: Object, required: true},
        targetThumbnail: {type: String},
        canvasHeight: {type: Number, default: 640},
        canvasWidth: {type: Number, default: 480},
        thumbHeight: {type: Number, default: 120},
        thumbWidth: {type: Number, default: 120},
    },

    created() {
        if (!this.targetImage) throw new Error("Must set 'targetImage'")
        if (!this.targetThumbnail) this.targetThumbnail = this.targetImage;
    },

    mounted() {
        console.log(this.annotation)
        const canvasDiv = this.$el.querySelector('#ubhdannoprefix_zoneeditcanvas')
        this.image = XrxUtils.createDrawing(canvasDiv, this.canvasWidth, this.canvasHeight)

        const thumbDiv = this.$el.querySelector('#ubhdannoprefix_zoneeditthumb')
        this.thumb = XrxUtils.createDrawing(thumbDiv, this.thumbWidth, this.thumbHeight)

        jQuery(this.$el).on('click', '.btn-group button', function() {
            this.classList.add('active');
            jQuery(this).siblings().removeClass('active');
        });

        this.thumb.setBackgroundImage(this.targetThumbnail, () => {
            // XXX why won't it fit initially
            this.thumb.setModeDisabled()
            // this.thumb.handleResize()
            this.thumb.getViewbox().setPosition(xrx.drawing.Position.NW)
            this.thumb.getViewbox().fit(true)
            this.showNavigationThumbnail()
        })

        this.image.setBackgroundImage(this.targetImage, () => {
            // console.log(this.image.getLayerBackground())
            this.image.setModeView()
            this.image.getViewbox().fitToWidth(false)
            this.thumb.getViewbox().setPosition(xrx.drawing.Position.NW)
            this.image.getViewbox().setZoomFactorMax(4)

            // Draw all svg targets
            this.fromSVG()
            this.image.draw()

            // Bind to SemToNotes events
            this.image.eventViewboxChange = () => {
                this.updateNavigationThumb()
            }
            this.image.eventShapeModify = () => {
                this.toSVG()
            }
            this.updateNavigationThumb()
        })

    },

    methods: {

        getSvgSelector() {
            return this.annotation.target
                .find(t => t.selector && t.selector.type === 'SvgSelector')
                .selector
        },

        fromSVG(...args) {
            this.image.getLayerShape().removeShapes()
            const shapes = XrxUtils.drawFromSvg(this.getSvgSelector().value, this.image)
            shapes.forEach(shape => XrxUtils.styleShapeEditable(shape))
        },

        toSVG(...args) {
            const svg = XrxUtils.svgFromShapes(this.image.getLayerShape().getShapes())
            console.log("New SVG", svg)
            this.getSvgSelector().value = svg
        },

        zoomOut(event) {
            this.image.getViewbox().zoomOut()
        },

        zoomIn(event) {
            this.image.getViewbox().zoomIn()
        },

        fitToCanvas(event) {
            this.image.getViewbox().setPosition(xrx.drawing.Position.NW)
            this.image.getViewbox().fit(true)
        },

        rotateLeft(event) {
            this.image.getViewbox().rotateLeft()
            this.thumb.getViewbox().rotateLeft()
        },

        rotateRight(event) {
            this.image.getViewbox().rotateRight()
            this.thumb.getViewbox().rotateRight()
        },

        setModeView(event) {
            this.image.setModeView()
        },

        moveZone(event) {
            this.image.setModeModify()
        },

        _addPath(pathType) {
            var shape = new xrx.shape[pathType](this.image)
            XrxUtils.styleShapeEditable(shape)
            // this.image.getLayerShape().addShapes(shape);
            this.image.setModeCreate(shape.getCreatable())
        },

        addPolygon(event) {
            this._addPath('Polygon')
        },

        addRectangle(event) {
            this._addPath('Rect')
        },

        deleteZone(event) {
            if (typeof(this.image.getSelectedShape()) == 'undefined') {
                window.alert("Please select a shape")
                return
            }
            if (window.confirm("Delete selected shape?")) {
                this.image.removeShape(this.image.getSelectedShape())
            }
        },

        updateNavigationThumb() {
            XrxUtils.navigationThumb(this.thumb, this.image)
        },

        showNavigationThumbnail() {
            document.querySelector('#ubhdannoprefix_zoneeditthumb').style.display = 'inherit';
        },

        hideNavigationThumbnail() {
            document.querySelector('#ubhdannoprefix_zoneeditthumb').style.display = 'none';
        },
    }

}
