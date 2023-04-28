import { defineStore } from 'pinia'

type CurrentUser = {
  authenticated: boolean
  id: string
  loginName: string
  name: string
}

const state: CurrentUser = {
  loginName: '',
  id: '',
  name: '',
  authenticated: false
}

export default defineStore('currentUser', {
  state: () => state,
  getters: {
    getId: (state) => state.id,
    getName: (state) => state.name,
    isAuthenticated: (state) => state.authenticated,
    getLoginName: (state) => state.loginName
  },
  actions: {
    setCurrentUser(user: CurrentUser) {
      this.authenticated = user.authenticated
      this.id = user.id
      this.loginName = user.loginName
      this.name = user.name
    }
  }
})
