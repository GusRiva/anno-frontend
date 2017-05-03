const Vue = require('vue')
const {
    ensureArray, add, remove,
} = require('@kba/anno-util')
const {
    textualHtmlBody,
    simpleTagBody,
    semanticTagBody,
    svgSelectorResource
} = require('@kba/anno-queries')

function initialState() {return {
    id: '',
    title: '',
    body: [],
    target: [],
    rights: "https://creativecommons.org/publicdomain/zero/1.0/",
}}

//
// initial state
//

const state = initialState()

//
// getters
//

const getters = {
    firstHtmlBody(a)     { return textualHtmlBody.first(a)     },
    simpleTagBodies(a)   { return simpleTagBody.all(a)         },
    semanticTagBodies(a) { return semanticTagBody.all(a)       },
    svgTarget(a)         { return svgSelectorResource.first(a) },
}

//
// mutations
//

const mutations = {

    ADD_TAG_BODY(state, v) {
        ensureArray(state, 'body')
        add(state, 'body', simpleTagBody.create(v))
    },

    ADD_SEMTAG_BODY(state, v) {
        ensureArray(state, 'body')
        add(state, 'body', semanticTagBody.create(v))
    },

    SET_HTML_BODY_VALUE(state, v) {
        if (!textualHtmlBody.first(state))
            add(state, 'body', textualHtmlBody.create())
        textualHtmlBody.first(state).value = v
    },

    SET_SVG_SELECTOR(state, {svg, source}) {
        if (!svgSelectorResource.first(state)) {
            add(state, 'target', svgSelectorResource.create({}))
        }
        if (source)
            svgSelectorResource.first(state).source = source
        svgSelectorResource.first(state).selector.value = svg
    },

    SET_TITLE(state, title) {
        state.title = title
    },

    SET_RIGHTS(state, rights) {
        state.rights = rights
    },

    REMOVE_TARGET(state, v) {
        remove(state, 'target', v)
    },

    REMOVE_BODY(state, v) {
        remove(state, 'body', v)
    },

    REPLACE_ANNOTATION(state, newState) {
        Object.keys(state).forEach(k => {
            if (newState[k]) Vue.set(state,  k, newState[k])
            else state[k] = null
        })
    },

    SET_SEMTAG_PROP(state, {n, prop, value}) {
        semanticTagBody.all(state)[n][prop] = value
    },

    ADD_TARGET(state, v) {
        ensureArray(state, 'target')
        add(state, 'target', v)
    },

    RESET_ANNOTATION(state) {
        Object.keys(state).forEach(k => state[k] = null)
        Object.assign(state, initialState())
    },

    SET_REPLY_TO(state, v) {
        state.replyTo = v
    },

    ADD_MOTIVATION(state, v) {
        ensureArray(state, 'motivation')
        add(state, 'motivation', v)
    },

}

module.exports = {
    state,
    getters,
    mutations,
}
