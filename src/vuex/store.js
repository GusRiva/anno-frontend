const {defaultLang} = require('../../l10n-config.json')
const axios = require('axios')
const Vue = require('vue')
const Vuex = require('vuex')
const {collectIds} = require('@kba/anno-util')
const apiFactory = require('../api')
const jwtDecode = require('jwt-decode')
const eventBus = require('../event-bus')

const editing = require('./module/editing')
const annotationList = require('./module/annotationList')

function isExpired(token) { return (token.exp < Date.now() / 1000) }

module.exports = {
    strict: process.env.NODE_ENV != 'production',
    state: {
        language: defaultLang,
        annoEndpoint: 'http://localhost:3000/anno',
        tokenEndpoint: 'http://localhost:3000/auth/token',
        loginEndpoint: 'http://localhost:3000/auth/login?from=',
        logoutEndpoint: 'http://localhost:3000/auth/logout',
        purlTemplate: null,
        purlId: null,
        targetSource: window.location.href,
        targetImage: null,
        targetThumbnail: null,
        collection: null,
        token: null,
        isLoggedIn: false,
        acl: null,
    },
    modules: {
        editing,
        annotationList,
    },
    getters: {

        allIds(state) {
            const ret = collectIds(state.annotationList.list)
            ret.push(state.targetSource)
            return ret
        },

    },
    mutations: {

        CHANGE_ACL(state, rules) {
            state.acl = state.acl || {}
            Object.assign(state.acl, rules)
        },

        SET_TOKEN(state, token) {
            state.token = token
            window.localStorage.setItem('anno-token', token);
        },

        DELETE_TOKEN(state, token) {
            state.token = null
            window.localStorage.removeItem('anno-token');
        },

        EMPTY_ACL(state) {
            state.acl = null
        },

        LOGIN(state) {
            state.isLoggedIn = true
        },

        LOGOUT(state) {
            state.isLoggedIn = false
        }

    },

    actions: {

        fetchToken({state, commit, dispatch}) {
            return new Promise((resolve, reject) => {
                var token = window.localStorage.getItem('anno-token');
                if (token) {
                    if (isExpired(token)) {
                        commit('DELETE_TOKEN')
                        commit('LOGOUT')
                    } else {
                        commit('SET_TOKEN', token)
                        commit('LOGIN')
                        return resolve()
                    }
                }
                axios.get(state.tokenEndpoint, {
                    // maxRedirects: 0, // does not work in the browser
                    withCredentials: 1, // without it, xhr won't set cookies for CORS
                }).then(resp => {
                    const token = resp.data
                    try {
                        jwtDecode(token)
                        commit('SET_TOKEN', token)
                        commit('LOGIN')
                        dispatch('fetchList')
                        resolve()
                    } catch (err) {
                        commit('LOGOUT')
                        reject("NO_TOKEN")
                    }
                }).catch(reject)
            })
        },

        fetchAcl({state, commit, getters}) {
            return new Promise((resolve, reject) => {
                console.log("ACL check")
                apiFactory(state).aclCheck(getters.allIds, (err, perms) => {
                    if (err) return reject(err)
                    commit('CHANGE_ACL', perms)
                    resolve()
                })
            })
        },

        fetchList({state, commit, dispatch}) {
            return new Promise((resolve, reject) => {
                const query = {'$target': state.targetSource}
                console.log("Search", query)
                apiFactory(state).search(query, (err, list) => {
                    if (err) return reject(err)
                    commit('REPLACE_LIST', list)
                    eventBus.$emit('fetched', list)
                    resolve(dispatch('fetchAcl'))
                })
            })
        },

        logout({state, commit}) {
            commit('DELETE_TOKEN')
            commit('EMPTY_ACL')
            commit('LOGOUT')
            if (state.logoutEndpoint) {
                window.location.replace(state.logoutEndpoint)
            }
        },

    },
}
