import { defineComponent, h, ref } from 'vue'
import { NButton, NInput, NCode, useDialog } from 'naive-ui'
import modeler from '@/store/modeler'
import { useI18n } from 'vue-i18n'

const Imports = defineComponent({
  name: 'Imports',
  setup() {
    const loadModel = useDialog()
    const { t } = useI18n()
    const modelerStore = modeler()
    const importRef = ref<HTMLInputElement | null>(null)
    let inputXml = ''

    const openImportWindow = () => {
      importRef.value && importRef.value.click()
    }

    const changeImportFile = () => {
      if (importRef.value && importRef.value.files) {
        const file = importRef.value.files[0]
        const reader = new FileReader()
        reader.readAsText(file)
        reader.onload = function () {
          const xmlStr = this.result
          modelerStore.getModeler!.importXML(xmlStr as string)
        }
        importRef.value.value = ''
        importRef.value.files = null
      }
    }

    const loadXml = async () => {
      try {
        const modeler = modelerStore.getModeler!

        if (!modeler) {
          return window.__messageBox.warning('模型加载失败，请刷新重试')
        }

        const newVar = loadModel.create({
          title: '读取',
          showIcon: false,
          content: () => {
            return h(
              'div',
              {
                class: 'preview-model'
              },
              [
                h(NInput, {
                  type: 'textarea',
                  placeholder: '请输入xml',
                  // value: inputXml,
                  ['onUpdate:value']: (value) => {
                    inputXml = value
                  },
                  rows: 23
                }),
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      marginTop: '20px',
                      justifyContent: 'flex-end'
                    }
                  },
                  [
                    h(
                      NButton,
                      {
                        type: 'info',
                        style: {},
                        onClick: () => {
                          modelerStore.getModeler!.importXML(inputXml as string)
                          newVar.destroy()
                        }
                      },
                      { default: () => '确定' }
                    )
                  ]
                )
              ]
            )
          }
        });
      } catch (e) {
        window.__messageBox.error((e as Error).message || (e as string))
      }
    }

    return () => (
      <span>
        <NButton type="info" secondary onClick={loadXml}>
          粘贴
        </NButton>
        <NButton type="info" secondary onClick={openImportWindow}>
          {t('toolbar.openFile')}
        </NButton>
        <input
          type="file"
          ref={importRef}
          style="display: none"
          accept=".xml,.bpmn"
          onChange={changeImportFile}
        ></input>
      </span>
    )
  }
})

export default Imports
