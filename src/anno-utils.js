//
// Helpers to deal with annotation properties being arrays/objects/strings
//

function ensureArray(state, k) {
    if (!Array.isArray(state[k]))
        state[k] = state[k] === undefined ? [] : [state[k]]
}

function add(state, k, v) {
    if (state[k] === undefined || state[k] === null) state[k] = v
    else state[k].push(v)
}

function remove(state, k, v) {
    if (Array.isArray(state[k])) {
        var vIndex = state[k].indexOf(v)
        state[k].splice(vIndex, 1)
    } else if (state.body === v) {
        state[k] = []
    }
}

function numberOf(state, k) {
    return Array.isArray(state[k]) ? state[k].length
        : state[k] ? 1
        : 0
}

//
// Type checking / filtering
//

function filter(needle, match) {
    if (Array.isArray(needle)) return needle.filter(match)
    else if (match(needle)) return [needle]
}

function find(needle, match) {
    if (Array.isArray(needle)) return needle.find(match)
    else if (match(needle)) return needle
}

function isHtmlBody(body) { return body && body.type === 'TextualBody' && body.format === 'text/html' }

function isSimpleTagBody(body) { return body && body.motivation === 'tagging' }

function isSemanticTagBody(body) { return body && (
    body.motivation === 'linking' || body.motivation === 'identifying' || body.motivation === 'classifying')
}

function isSvgTarget(t) { return t && t.selector && t.selector.type === 'SvgSelector' }

function firstHtmlBody(state) {
    return find(state.body, isHtmlBody)
}

function simpleTagBodies(state) {
    return filter(state.body, isSimpleTagBody)
}

function semanticTagBodies(state) {
    return filter(state.body, isSemanticTagBody)
}

function svgTarget(state) {
    return find(state.target, isSvgTarget)
}

function setToVersion(curState, newState) {
    // Object.keys(curState).forEach(k => {
    //     if (k === 'hasReply' || k === 'hasVersion') return
    //     curState[k] = null
    // })
    Object.keys(newState).forEach(k => {
        if (k === 'hasReply' || k === 'hasVersion') return
        curState[k] = newState[k]
    })
    console.log(newState)
}

//
// collectIds from a list
//

function collectIds(list) {
    function _collectIds(list, ret) {
        list.forEach(obj => {
            if (!obj) return;
            else if (obj.id) ret.push(obj.id)
            else if (typeof obj === 'object')
                Object.keys(obj).forEach(k => _collectIds([obj[k]], ret))
        })
        return ret
    }
    const ret = []
    _collectIds(list, ret)
    return ret
}


module.exports = {

    ensureArray,
    add,
    remove,
    numberOf,

    find,
    filter,

    isHtmlBody,
    isSimpleTagBody,
    isSemanticTagBody,
    isSvgTarget,

    firstHtmlBody,
    simpleTagBodies,
    semanticTagBodies,
    svgTarget,

    setToVersion,

    collectIds,

}
