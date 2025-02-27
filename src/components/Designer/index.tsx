import { defineComponent, ref, toRefs, nextTick, watch } from 'vue'
import type { PropType } from 'vue'
import { storeToRefs } from 'pinia'

import editor from '@/store/editor'
import modulesAndModdle from '@/components/Designer/modulesAndModdle'
import initModeler from '@/components/Designer/initModeler'
import { createNewDiagram } from '@/utils'

const Designer = defineComponent({
  name: 'BpmnDesigner',
  props: {
    xml: {
      type: String as PropType<string>,
      default: undefined
    },
    processId: {
      type: String as PropType<string>,
      default: undefined
    },
    processName: {
      type: String as PropType<string>,
      default: undefined
    }
  },
  emits: ['update:xml', 'command-stack-changed'],
  setup(props, { emit }) {
    const editorStore = editor()
    const { editorSettings } = storeToRefs(editorStore)
    const { xml, processId, processName } = toRefs(props)
    const designer = ref<HTMLDivElement | null>(null)

    watch(
      () => editorSettings.value,
      async (value, oldValue) => {
        try {
          const modelerModules = modulesAndModdle(editorSettings)
          await nextTick()
          await initModeler(designer, modelerModules, emit)
          if (!oldValue || value.processEngine !== oldValue!.processEngine) {
            await createNewDiagram()
          } else {
            await createNewDiagram(xml.value, editorSettings.value)
          }
        } catch (e) {
          console.log(e)
        }
      },
      { deep: true, immediate: true }
    )

    watch(
      () => xml.value,
      async (value, oldValue) => {
        try {
          const modelerModules = modulesAndModdle(editorSettings)
          await nextTick()
          await initModeler(designer, modelerModules, emit)
          editorStore.setProcessId(processId.value as string)
          editorStore.setProcessName(processName.value as string)
          await createNewDiagram(xml.value, editorSettings.value)
        } catch (e) {
          console.log(e)
        }
      },
      { deep: true, immediate: true }
    )
    return () => <div ref={designer} class="designer"></div>
  }
})

export default Designer
