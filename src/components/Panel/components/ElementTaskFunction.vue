<template>
  <n-collapse-item name="element-function-form">
    <template #header>
      <collapse-title :title="$t('panel.function')">
        <lucide-icon name="FunctionSquare" />
      </collapse-title>
    </template>
    <template #header-extra>
      <n-tag type="primary" round>
        {{ data.length }}
      </n-tag>
    </template>
    <div class="element-extension-function-form">
      <n-data-table
        size="small"
        max-height="20vh"
        :columns="tableColumns"
        :data="data"
        :bordered="false"
        :single-line="false"
      />

      <n-button type="info" class="inline-large-button" secondary @click="addItem">
        <lucide-icon :size="20" name="Plus" />
        <span>{{ $t('panel.addFunction') }}</span>
      </n-button>
    </div>
    <n-modal
      v-model:show="showModal"
      :style="{ width: '36%', height: '520px' }"
      :mask-closable="false"
      preset="dialog"
      :title="$t('panel.function')"
      positive-text="确认"
      @positive-click="onPositiveClick"
    >
      <function-editor
        ref="editorRef"
        :function="editorFunction"
        style="margin-top: 30px"
      ></function-editor>
    </n-modal>
  </n-collapse-item>
</template>

<script lang="ts" setup>
  import { Edit, Trash2 } from 'lucide-vue-next'
  import {h, onBeforeUnmount, onMounted, ref} from 'vue'
  import modelerStore from '@/store/modeler'
  import { NButton, NIcon, NPopconfirm } from 'naive-ui'
  import { useI18n } from 'vue-i18n'
  import FunctionEditor from '@/components/Panel/components/SubChild/FunctionEditor.vue'
  import { getTaskFunction, setTaskFunction } from '@/bo-utils/taskUtil'
  import { Base } from 'diagram-js/lib/model'
  import { isUserTask } from '@/bo-utils/conditionUtil'
  import axios from '@/axios'
  import EventEmitter from '@/utils/EventEmitter'
  import { debounce } from 'min-dash'

  const { t } = useI18n()

  const modeler = modelerStore()

  const showModal = ref<boolean>(false)

  let editorFunction: undefined

  let data = ref([] as any[])
  const tableColumns = [
    {
      title: '名称',
      key: 'name'
    },
    {
      title: '代码',
      key: 'code'
    },
    {
      title: '值',
      key: 'value',
      ellipsis: true,
      width: '50%'
    },
    {
      title: t('panel.operations'),
      key: 'operation',
      align: 'center',
      width: 75,
      render: (row, index) => [
        h(
          NButton,
          {
            quaternary: true,
            circle: true,
            size: 'small',
            onClick: () => editItem(row)
          },
          { icon: () => h(NIcon, null, { default: () => h(Edit) }) }
        ),
        h(
          NPopconfirm,
          { onPositiveClick: () => deleteItem(row), negativeText: '取消', positiveText: '确认' },
          {
            trigger: () =>
              h(
                NButton,
                {
                  quaternary: true,
                  circle: true,
                  size: 'small'
                },
                {
                  icon: () =>
                    h(NIcon, null, {
                      default: () =>
                        h(Trash2, {
                          color: 'red'
                        })
                    })
                }
              ),
            default: () => h('span', {}, { default: () => '确认删除？' })
          }
        )
      ]
    }
  ]

  const editorRef = ref<any>(null)

  const onPositiveClick = () => {
    editorRef.value.getData(
      (result) => {
        result.value = JSON.stringify(result.value)
        const processId = modeler.getActive.businessObject.$parent.id
        const processName = modeler.getActive.businessObject.$parent.name
        const activeId = modeler.getActiveId
        const activeName = modeler.getActive.businessObject.name
        const categoryCode = processId + activeId
        const categoryName = processName + '_' + activeName
        axios
          .post(`/workflow/rest/function/${categoryCode}/add?categoryName=${categoryName}`, {
            ...result,
            state: true
          })
          .then((response) => {
            if (response.data.status === 1) {
              if (!getTaskFunction(modeler.getActive as Base)) {
                setTaskFunction(modeler.getActive as Base, categoryCode)
              }
              reloadData()
              showModal.value = false
            } else {
              window.__messageBox.warning(response.data.message)
            }
          })
          .catch((error) => {
            window.__messageBox.warning(error.message)
          })
      },
      () => {}
    )
    return false
  }

  const deleteItem = (row) => {
    deleteData(row.id).then((response) => {
      if (response.data.status === 1) {
        reloadData()
      } else {
        window.__messageBox.warning(response.data.message)
      }
    })
  }
  const editItem = (row) => {
    editorFunction = row
    showModal.value = true
  }

  const addItem = () => {
    editorFunction = undefined
    showModal.value = true
  }

  const getData = (categoryCode: string) => {
    return axios.get(`/workflow/rest/function/${categoryCode}`)
  }

  const deleteData = (id: string) => {
    return axios.delete(`/workflow/rest/function/${id}`)
  }

  const reloadData = debounce(() => {
    if (isUserTask(modeler.getActive)) {
      const taskFunction = getTaskFunction(modeler.getActive as Base)
      if (taskFunction) {
        return new Promise((resolve, reject) => {
          getData(taskFunction)
            .then((response) => {
              if (response.data.status === 1) {
                if (response.data.content && response.data.content.length > 0) {
                  data.value.splice(0, data.value.length)
                  data.value = data.value.concat(response.data.content)
                } else {
                  data.value = []
                  //todo: 不存在功能属性，删除功能目录
                  setTaskFunction(modeler.getActive as Base, undefined)
                }
                resolve(response.data.content)
              } else {
                window.__messageBox.warning(response.data.message)
                reject(response.data.message)
              }
            })
            .catch((error) => {
              reject(error.message)
              window.__messageBox.warning(error.message)
            })
        })
      } else {
        data.value.splice(0, data.value.length)
      }
    }
  }, 100)

  onMounted(() => {
    reloadData()
    EventEmitter.on('element-update', reloadData)
  })

  onBeforeUnmount(() => {
    EventEmitter.removeListener('element-update', reloadData)
  })
</script>
