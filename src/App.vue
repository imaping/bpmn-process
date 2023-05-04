<template>
  <n-config-provider
    abstract
    :component-options="{ DynamicInput: { buttonSize: 'small' } }"
    :hljs="hljs"
  >
    <n-dialog-provider>
      <div id="designer-container" :class="computedClasses">
        <n-message-provider>
          <toolbar v-if="showToolbar"></toolbar>
          <div class="main-content">
            <Palette v-if="customPalette"></Palette>
            <designer :xml="processXml"></designer>
            <Panel v-if="customPenal"></Panel>
            <div v-else id="camunda-penal" class="camunda-penal"></div>
          </div>
          <ContextMenu></ContextMenu>
        </n-message-provider>
      </div>
    </n-dialog-provider>
  </n-config-provider>
</template>
<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue'
  import Toolbar from '@/components/Toolbar'
  import Palette from '@/components/Palette'
  import Designer from '@/components/Designer'
  import Panel from '@/components/Panel'
  import ContextMenu from '@/components/ContextMenu/index.vue'
  import { EditorSettings } from 'types/editor/settings'
  import { defaultSettings } from '@/config'

  import hljs from 'highlight.js/lib/core'
  import xml from 'highlight.js/lib/languages/xml'
  import json from 'highlight.js/lib/languages/json'
  import { NConfigProvider, NDialogProvider, NMessageProvider } from 'naive-ui'
  import { getQueryValue } from '@/utils'
  import axios from '@/axios'

  hljs.registerLanguage('xml', xml)
  hljs.registerLanguage('json', json)

  const editorSettings = ref<EditorSettings>({ ...defaultSettings })

  const processXml = ref<string | undefined>(undefined)

  const customPalette = computed<boolean>(() => editorSettings.value.paletteMode === 'custom')
  const customPenal = computed<boolean>(() => editorSettings.value.penalMode === 'custom')
  const showToolbar = computed<boolean>(() => editorSettings.value.toolbar)

  const computedClasses = computed<string>(() => {
    const baseClass = ['designer-container']
    customPalette.value && baseClass.push('designer-with-palette')
    customPenal.value && baseClass.push('designer-with-penal')
    editorSettings.value.bg === 'grid-image' && baseClass.push('designer-with-bg')
    editorSettings.value.bg === 'image' && baseClass.push('designer-with-image')

    return baseClass.join(' ')
  })

  onMounted(() => {
    document.body.addEventListener('contextmenu', function (ev) {
      ev.preventDefault()
    })
    getXml()
  })
  const processModelId = getQueryValue('id')

  const getXml = async () => {
    const result = await axios.get(`/workflow/rest/models/${processModelId}/xml`)
    processXml.value = result.data.content.modelEditorXml
  }
</script>
