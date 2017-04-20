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
// actions
//

const actions = {

    // setSvgSelector({commit, state}, {svg, source}) {
    //     if (!svgSelectorResource.first(state)) {
    //         commit('ADD_SVG_TARGET', {source})
    //     }
    //     commit('SET_SVG_SELECTOR', svg)
    // },

    // addSimpleTag({commit, state}, v) {
    //     commit('ADD_TAG_BODY')
    // },

    // addSemanticTag({commit, state}, v) {
    //     commit('ADD_SEMTAG_BODY')
    // },

    // replaceAnnotation({commit, state}, newState) {
    //     commit('REPLACE_ANNOTATION', newState)
    // },

    // removeBody({commit, state}, v) {
    //     commit('REMOVE_BODY', v)
    // },

    // removeTarget({commit, state}, v) {
    //     commit('REMOVE_TARGET', v)
    // },

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

    ADD_SVG_TARGET(state, target={}) {
        ensureArray(state, 'target')
        add(state, 'target', Object.assign(target, svgSelectorResource.create()))
    },

    SET_HTML_BODY_VALUE(state, v) {
        if (!textualHtmlBody.first(state))
            add(state, 'body', textualHtmlBody.create())
        textualHtmlBody.first(state).value = v
    },

    SET_SVG_SELECTOR(state, {svg, source}) {
        if (!svgSelectorResource.first(state))
            add(state, 'target', svgSelectorResource.create({source}))
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
        Object.assign(state, newState)
        // Object.keys(state).forEach(k => {
        //     if (newState[k]) state[k] = newState[k]
        //     else state[k] = null
        // })
    },

    SET_SEMTAG_PROP(state, {n, prop, value}) {
        semanticTagBody.all(state)[n][prop] = value
    },

    ADD_TARGET(state, v) {
        ensureArray(state, 'target')
        add(state, 'target', v)
    },

    RESET_ANNOTATION(state) {
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
    actions,
    getters,
    mutations,
}
