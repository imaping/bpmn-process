import { defineComponent, h, ref } from 'vue'
import { NButton, NInput, NCode, useDialog } from 'naive-ui'
import modeler from '@/store/modeler'
import { useI18n } from 'vue-i18n'
import { getQueryValue } from '@/utils'
import axios from '@/axios'

const Save = defineComponent({
  name: 'Save',
  setup() {
    const modelerStore = modeler()

    const saveXml = async () => {
      try {
        const modeler = modelerStore.getModeler!
        const processModelId = getQueryValue('id')
        const { xml } = await modeler.saveXML({ format: true, preamble: true })
        const result = await axios.put(`/workflow/rest/models/${processModelId}/xml`, {
          editorXml: xml,
          isNewVersion: false,
          updatedAt: Date.now()
        })
        if (result.data.status === 0) {
          window.__messageBox.info(result.data.message)
          return
        }
        window.__messageBox.info('保存成功')
        if (!modeler) {
          return window.__messageBox.warning('模型加载失败，请刷新重试')
        }
      } catch (e) {
        window.__messageBox.error((e as Error).message || (e as string))
      }
    }

    return () => (
      <span>
        <NButton type="info" secondary onClick={saveXml}>
          保存
        </NButton>
      </span>
    )
  }
})

export default Save
