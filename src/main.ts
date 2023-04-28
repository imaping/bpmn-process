import { createApp } from 'vue'
import { createPinia, mapActions } from 'pinia'
import App from './App.js'

import './styles/index.scss'

import {
  createDiscreteApi,
  create,
  NColorPicker,
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NButton,
  NButtonGroup,
  NTag,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NPopover,
  NDrawer,
  NDrawerContent,
  NModal,
  NCode,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NCheckbox,
  NCheckboxGroup,
  NSelect,
  NSwitch,
  NGrid,
  NGridItem,
  NTree,
  NPopconfirm,
  NCard,
  NEmpty,
  NIcon
} from 'naive-ui'

const naive = create({
  components: [
    NColorPicker,
    NConfigProvider,
    NMessageProvider,
    NDialogProvider,
    NButton,
    NButtonGroup,
    NTag,
    NCollapse,
    NCollapseItem,
    NDataTable,
    NPopover,
    NDrawer,
    NDrawerContent,
    NModal,
    NCode,
    NForm,
    NFormItem,
    NInput,
    NInputNumber,
    NRadio,
    NRadioGroup,
    NCheckbox,
    NCheckboxGroup,
    NSelect,
    NSwitch,
    NGrid,
    NGridItem,
    NTree,
    NPopconfirm,
    NCard,
    NEmpty,
    NIcon
  ]
})

const { message, notification, dialog, loadingBar } = createDiscreteApi([
  'message',
  'dialog',
  'notification',
  'loadingBar'
])
window.__messageBox = message

import LucideIcon from '@/components/common/LucideIcon.vue'
import EditItem from '@/components/common/EditItem.vue'
import CollapseTitle from '@/components/common/CollapseTitle.vue'

import 'virtual:svg-icons-register'

import i18n from '@/i18n'
import axios from '@/axios'
import currentUser from '@/store/currentUser'

const app = createApp(App)

const pinia = createPinia()

app.use(i18n)
app.use(pinia)
app.use(naive)
app.component('LucideIcon', LucideIcon)
app.component('EditItem', EditItem)
app.component('CollapseTitle', CollapseTitle)

app.mount('#app')

const store = currentUser()

axios.get('management/rest/user-info').then((response) => {
  if (response.data.status === 1) {
    store.setCurrentUser(response.data.content)
  }
})
