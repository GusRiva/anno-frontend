const $ = require('jquery')
const _dateformat = require('dateformat')
const eventBus = require('../event-bus')
const {
    numberOf,
} = require('@kba/anno-util')
const {
    relationLinkBody,
    textualHtmlBody,
    simpleTagBody,
    semanticTagBody,
    svgSelectorResource
} = require('@kba/anno-queries')

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
 * - `purlTemplate` A string template for the persistent URL. `{{ slug }}` will
 *   be replaced by the slug of the annotation
 * - `purlId` The URL of the persistently adressed annotation
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
 * - `setToVersion`: Reset the currently edited annotation to the revision passed
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
        purlTemplate: {type: String, required: false},
        purlId: {type: String, required: false},
        // Controls whether comment is collapsible or not
        asReply: {type: Boolean, default: false},
        collapseInitially: {type: Boolean, default: false},
        dateFormat: {type: String, default: 'dd.mm.yyyy HH:MM:ss'},
    },
    template: require('./anno-viewer.html'),
    style:    require('./anno-viewer.scss'),
    mounted() {

        // Show popover with persistent URL
        const Clipboard = require('clipboard')
        const purlPopoverTrigger = this.$el.querySelector('[data-toggle="popover"]')
        $(purlPopoverTrigger).popover(); 
        $(purlPopoverTrigger).on('shown.bs.popover', function() {
            const purlPopoverDiv = purlPopoverTrigger.nextElementSibling
            const clip = new Clipboard(purlPopoverDiv.querySelector("[data-clipboard-text]"))
            clip.on('success', () => {
                const successLabel = $(".label-success", purlPopoverDiv)
                successLabel.show()
                setTimeout(() => $(successLabel).hide(), 2000)
            })
        })

        // React to highlighting events startHighlighting / stopHighlighting / toggleHighlighting
        ;['start', 'stop', 'toggle'].forEach(state => {
            const method = `${state}Highlighting`
            eventBus.$on(method, (id, expand) => { if (id == this.id) this[method](expand) })
        })
    },
    computed: {
        id()                 { return this.annotation.id },
        created()            { return this.annotation.created },
        creator()            { return this.annotation.creator },
        modified()           { return this.annotation.modified },
        title()              { return this.annotation.title },
        isOlderVersion()     {
            if (!this.annotation.versionOf) return false
            const versionedId = this.annotation.id
            const unversionedId = this.annotation.versionOf
            const versions = this.annotation.hasVersion
            if (versions.findIndex(r => r.id === versionedId) === versions.length - 1) return false
            return true
        },
        firstHtmlBody()      { return textualHtmlBody.first(this.annotation) },
        simpleTagBodies()    { return simpleTagBody.all(this.annotation) },
        semanticTagBodies()  { return semanticTagBody.all(this.annotation) },
        relationLinkBodies() { return relationLinkBody.all(this.annotation) },
        svgTarget()          { return svgSelectorResource.first(this.annotation) },
        purl() { return this.purlTemplate 
                ? this.purlTemplate.replace('{{ slug }}', this.id.replace(/.*\//, ''))
                : this.id },
        slug() {
            if (!this.annotation.id) return 'unsaved-annotation-' + Date.now()
            return this.annotation.id.replace(/[^A-Za-z0-9]/g, '')
        },
        isPurl() {
            return this.annotation.id === this.purlId
        }
    },
    data() {
        return {
            currentVersion: this.initialAnnotation,
            highlighted: false,
            collapsed: this.collapseInitially,
        }
    },
    methods: {
        revise()     { return eventBus.$emit('revise', this.annotation) },
        reply()      { return eventBus.$emit('reply',  this.annotation) },
        remove()     { return eventBus.$emit('remove', this.annotation) },
        mouseenter() {
            this.startHighlighting()
            eventBus.$emit("mouseenter", this.id)
        },
        mouseleave() {
            this.stopHighlighting()
            eventBus.$emit("mouseleave", this.id)
        },

        startHighlighting(expand)  {
            this.highlighted = true;
            if (expand) {
                this.collapsed = false
                // also highlight/expand the root id so the anno is visible
                const rootId = this.id.replace(/[~\.][~\.0-9]+$/, '')
                // console.log(rootId)
                if (rootId !== this.id) {
                    eventBus.$emit('startHighlighting', rootId, expand)
                }
            }
        },
        stopHighlighting()   { this.highlighted = false },
        toggleHighlighting() { this.highlighted = ! this.highlighted },

        dateformat(date) { return date ? _dateformat(date, this.dateFormat) : '' },
        collapse(collapseState) {
            this.collapsed = collapseState === 'toggle' ? ! this.collapsed : collapseState === 'hide'
        },
        numberOf(k) { return numberOf(this.annotation, k) },
        setToVersion(newState) {
            Object.assign(this.annotation, newState)
            eventBus.$emit('setToVersion', this.annotation)
        },
        versionIsShown(version) {
            return this.isOlderVersion
                ? version.created == this.annotation.created
                : version.created == this.annotation.modified
        },
    },
}
