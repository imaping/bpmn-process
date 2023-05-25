<template>
  <n-collapse-item name="element-task-events">
    <template #header>
      <collapse-title :title="$t('panel.eventListeners')">
        <lucide-icon name="ClipboardList" />
      </collapse-title>
    </template>
    <template #header-extra>
      <n-tag type="primary" round>
        {{ data.length }}
      </n-tag>
    </template>
    <div class="element-extension-events">
      <n-data-table size="small" max-height="20vh" :columns="columns" :data="data" />
      <n-button type="info" class="inline-large-button" secondary @click="showModal = true">
        <lucide-icon :size="20" name="Plus" />
        <span>{{ $t('panel.addTaskEvent') }}</span>
      </n-button>
    </div>
    <n-modal
      v-model:show="showModal"
      :style="{ width: '80%', height: '650px' }"
      :mask-closable="false"
      preset="dialog"
      title="事件服务"
      positive-text="确认"
      @positive-click="onPositiveClick"
    >
      <event-editor ref="editorRef" :selected="data"></event-editor>
    </n-modal>
  </n-collapse-item>
</template>

<script setup lang="ts">
  import { h, onBeforeUnmount, onMounted, ref, toRaw } from 'vue'
  import { NButton, NIcon, NPopconfirm } from 'naive-ui'
  import { useI18n } from 'vue-i18n'
  import EventEditor from '@/components/Panel/components/SubChild/EventEditor.vue'
  import { addTaskListener, getTaskListeners, removeTaskListener } from '@/bo-utils/taskUtil'
  import modeler from '@/store/modeler'
  import {
    addExecutionListener,
    getExecutionListeners,
    removeExecutionListener
  } from '@/bo-utils/executionListenersUtil'
  import { Base } from 'diagram-js/lib/model'
  import { isUserTask } from '@/bo-utils/conditionUtil'
  import EventEmitter from '@/utils/EventEmitter'
  import { Trash2 } from 'lucide-vue-next'
  import { debounce } from 'min-dash'

  const modelerStore = modeler()
  // const getActive = computed(() => modelerStore.getActive!)

  const { t } = useI18n()

  const editorRef = ref<any>(null)
  let data = ref([])
  const showModal = ref<boolean>(false)
  const columns = [
    {
      title: '事件',
      key: 'listenerTypeLabel',
      width: 60
    },
    {
      title: '代码',
      align: 'center',
      key: 'code'
    },
    // {
    //   title: '类型',
    //   key: 'eventType'
    // },
    {
      title: t('panel.operations'),
      key: 'operation',
      align: 'center',
      width: 60,
      render: (row, index) =>
        h(
          NPopconfirm,
          {
            onPositiveClick: () => deleteItem(index, row),
            negativeText: '取消',
            positiveText: '确认'
          },
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
    }
  ]

  const onPositiveClick = () => {
    editorRef.value.getData((result) => {
      if (
        data.value.some((d) => d.listenerType === result.listenerType && d.code === result.code)
      ) {
        window.__messageBox.warning(
          `已存在事件类型=[${result.listenerTypeLabel}],事件代码=[${result.code}]的记录`
        )
      } else {
        switch (result.listenerType) {
          case 'create':
          case 'assignment':
          case 'complete':
          case 'delete':
            addTaskListener(modelerStore.getActive, {
              type: 'expression',
              event: result.listenerType,
              expression: `\${restfulExecutionEvent.executeTaskListener(${result.code},task)}`
            })
            break
          case 'start':
          case 'end':
          case 'take':
            addExecutionListener(modelerStore.getActive, {
              type: 'expression',
              event: result.listenerType,
              expression: `\${restfulExecutionEvent.executeExecutionListener(${result.code},execution)}`
            })
            break
        }
        data.value.push(result)
        showModal.value = false
      }
    })
    return false
  }

  const listenerTypes = [
    { label: '开始', value: 'start' },
    { label: '结束', value: 'end' },
    { label: '连线', value: 'take' },
    { label: '创建', value: 'create' },
    { label: '指派', value: 'assignment' },
    { label: '完成', value: 'complete' },
    { label: '删除', value: 'delete' }
  ]
  const deleteItem = (index, row) => {
    switch (row.event) {
      case 'create':
      case 'assignment':
      case 'complete':
      case 'delete':
        removeTaskListener(modelerStore.getActive as Base, toRaw(row.raw))
        break
      case 'start':
      case 'end':
      case 'take':
        removeExecutionListener(modelerStore.getActive as Base, toRaw(row.raw))
        break
    }
    data.value.splice(index, 1)
  }
  const reloadData = debounce(() => {
    data.value.splice(0, data.value.length)
    let originListeners = getExecutionListeners(modelerStore.getActive as Base)
    const reg = /\${restfulExecutionEvent\.execute(TaskListener|ExecutionListener)\((.*),(.*)\)}/
    if (isUserTask(modelerStore.getActive)) {
      const taskListeners = getTaskListeners(modelerStore.getActive as Base)
      originListeners = originListeners.concat(taskListeners)
    }
    originListeners = originListeners.filter((d) => {
      const id = d.get('id')
      return id && id.startsWith('__system__') ? false : d.expression
    })
    let listeners = originListeners.map((item) => {
      const regExpExecArray = reg.exec(item.expression)
      const listenerTypeLabel = listenerTypes.find((d) => d.value === item.event)?.label
      let code = item.expression
      if (regExpExecArray && regExpExecArray.length > 1) {
        code = regExpExecArray[2]
      }
      return Object.assign({}, { listenerTypeLabel, code, event: item.event, raw: item })
    })
    data.value = data.value.concat(listeners)
  }, 100)
  onMounted(() => {
    reloadData()
    EventEmitter.on('element-update', reloadData)
  })

  onBeforeUnmount(() => {
    EventEmitter.removeListener('element-update', reloadData)
  })
</script>
