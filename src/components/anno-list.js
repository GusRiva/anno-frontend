/*
 * ### anno-list
 *
 * List of [anno-viewer](#anno-viewer) components.
 *
 * #### Props
 *
 * - `collapseInitially`: Whether all annotations should be collapsed or not
 *
 * #### Events
 *
 * - `create`: A new annotation on `targetSource` shall be created
 *
 */
const eventBus = require('../event-bus')

module.exports = {
    mixins: [
        require('../mixin/l10n'),
        require('../mixin/auth'),
        require('../mixin/api'),
        require('../mixin/prefix'),
    ],
    props: {
        collapseInitially: {type: Boolean, default: false},
    },
    data() { return {
        // TODO
        options: {},
        collapsed: this.collapseInitially
    }},
    template: require('./anno-list.html'),
    style: require('./anno-list.scss'),
    mounted() {
        this.sort()
    },
    computed: {
        sortedBy() { return this.$store.state.annotationList.sortedBy },
        list() { return this.$store.state.annotationList.list },
        targetSource() { return this.$store.state.targetSource },
        token() { return this.$store.state.token },
        purlTemplate() { return this.$store.state.purlTemplate },
        purlId() { return this.$store.state.purlId },
        isLoggedIn() { return this.$store.state.isLoggedIn },
        logoutEndpoint() { return this.$store.state.logoutEndpoint },
        loginEndpoint() { return this.$store.state.loginEndpoint },
        numberOfAnnotations() { return this.$store.getters.numberOfAnnotations },
    },
    methods: {
        logout() { this.$store.dispatch('logout') },
        create()   { return eventBus.$emit('create', this.targetSource) },

        collapseAll(state) {
            this.$children.forEach(annoViewer => annoViewer.collapse && annoViewer.collapse(state))
            this.collapsed = ! this.collapsed
        },
        sort(...args) {
            this.$store.dispatch('sort', ...args)
        },
    },
}

