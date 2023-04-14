import { defineStore } from 'pinia'

type UserTaskStore = {
  allowBack: boolean
  allowCopy: boolean
}

const state: UserTaskStore = {
  allowBack: false,
  allowCopy: false
}

export default defineStore('userTask', {
  state: () => state,
  getters: {
    isAllowBack: (state) => state.allowBack,
    isAllowCopy: (state) => state.allowCopy
  },
  actions: {
    setAllowBack(allowBack: boolean) {
      this.allowBack = allowBack
    },
    setAllowCopy(allowCopy: boolean) {
      this.allowCopy = allowCopy
    }
  }
})
