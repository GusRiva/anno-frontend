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
    // style: require('./anno-list.css'),
    mounted() {
        this.sort()
    },
    computed: {
        sortedBy() { return this.$store.state.annotationList.sortedBy },
        list() { return this.$store.state.annotationList.list },
        targetSource() { return this.$store.state.targetSource },
        token() { return this.$store.state.token },
    },
    methods: {
        login() {
            this.$store.dispatch('fetchToken').catch(err => {
                if (err === "NO_TOKEN")
                    window.location.replace(
                        this.$store.state.loginEndpoint + encodeURIComponent(window.location.href))
            })
        },
        logout() {
            this.$store.commit('DELETE_TOKEN')
            this.$store.commit('EMPTY_ACL')
        },
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

