const $ = require('jquery')
const _dateformat = require('dateformat')
const {
    numberOf,
    firstHtmlBody, simpleTagBodies, semanticTagBodies, svgTarget,
    setToVersion,
} = require('@kba/anno-util')

/**
 * ### anno-viewer
 *
 * Show an annotation as a bootstrap panel.
 *
 * #### Props
 *
 * - **`annotation`**: The annotation this viewer shows
 * - `asReply`: Whether the annotation should be displayed as a reply (no
 *   colapsing, smaller etc.)
 * - `collapseInitially`: Whether the anntotation should be collapsed after
 *   first render
 * - dateFormat: Format of date stamps. Default: `dd.mm.yyyy hh:MM:ss`
 *
 * #### Events
 *
 * - `revise`: This annotation should be opened in an editor for revision
 * - `reply`: A new annotation as a reply to this annotation should be opened in an editor
 * - `remove`: This annotation should be removed from the store
 * - `startHighlighting`: Start highlighting this annotation
 * - `stopHighlighting`: Stop highlighting this annotation
 * - `mouseenter`: The mouse cursor is now on this annotation
 * - `mouseleave`: The mouse cursor has left this annotation
 */

module.exports = {
    mixins: [
        require('../mixin/l10n'),
        require('../mixin/auth'),
        require('../mixin/prefix'),
    ],
    name: 'anno-viewer', // necessary for nesting
    props: {
        annotation: {type: Object, required: true},
        // Controls whether comment is collapsible or not
        asReply: {type: Boolean, default: false},
        collapseInitially: {type: Boolean, default: false},
        dateFormat: {type: String, default: 'dd.mm.yyyy hh:MM:ss'},
    },
    template: require('./anno-viewer.html'),
    style:    require('./anno-viewer.scss'),
    mounted() {

        // Show popover with persistent URL
        $('[data-toggle="popover"]', this.$el).popover(); 

        // React to highlighting events
        ;['start', 'stop', 'toggle'].forEach(state => {
            const method = `${state}Highlighting`
            this.$root.$on(method, (id) => { if (id == this.id) this[method]() })
        })
    },
    computed: {
        firstHtmlBody()     { return firstHtmlBody(this.annotation) },
        simpleTagBodies()   { return simpleTagBodies(this.annotation) },
        semanticTagBodies() { return semanticTagBodies(this.annotation) },
        id() { return this.annotation.id },
        slug() {
            if (!this.annotation.id) return 'unsaved-annotation-' + Date.now()
            return this.annotation.id.replace(/[^A-Za-z0-9]/g, '')
        },
    },
    data() {
        return {
            currentVersion: this.initialAnnotation,
            highlighted: false,
            collapsed: this.collapseInitially,
        }
    },
    methods: {
        revise()     { return this.$root.$emit('revise', this.annotation) },
        reply()      { return this.$root.$emit('reply', this.annotation) },
        remove()     { return this.$root.$emit('remove', this.annotation) },
        mouseenter() { return this.$root.$emit("startHighlighting", this.id) },
        mouseleave() { return this.$root.$emit("stopHighlighting", this.id) },

        startHighlighting() { this.highlighted = true },
        stopHighlighting() { this.highlighted = false },
        toggleHighlighting() { this.highlighted = ! this.highlighted },

        dateformat(date) { return date ? _dateformat(date, this.dateFormat) : '' },
        collapse(collapseState) {
            this.collapsed = collapseState === 'toggle' ? ! this.collapsed : collapseState === 'hide'
        },
        numberOf(k) { return numberOf(this.annotation, k) },
        setToVersion(newState) {
            this.$store.commit('RESET_ANNOTATION')
            this.$store.commit('REPLACE_ANNOTATION', newState)
        }
    },
}
