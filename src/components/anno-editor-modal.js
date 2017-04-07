const $ = require('jquery')
const eventBus = require('../event-bus')

module.exports = {
    mixins: [
        require('../mixin/l10n'),
        require('../mixin/auth'),
    ],
    template: require('./anno-editor-modal.html'),
    computed: {
        id() { return this.$store.state.annotation.id },
    },
    created() {
        eventBus.$on('open-editor', () => this.show())
    },
    methods: {
        save() { eventBus.$emit('save') },
        remove() { eventBus.$emit('remove', this.id) },
        show() { $(this.$el).modal('show') },
    },
}
