<template>
  <n-collapse-item name="element-task-form">
    <template #header>
      <collapse-title :title="$t('panel.taskForm')">
        <lucide-icon name="StretchHorizontal" />
      </collapse-title>
    </template>
    <template #header-extra>
      <n-tag type="primary" round>
        {{ data.length }}
      </n-tag>
    </template>
    <div class="element-extension-task-form">
      <n-data-table size="small" max-height="20vh" :columns="formColumns" :data="data" />

      <n-button type="info" class="inline-large-button" secondary @click="showModal = true">
        <lucide-icon :size="20" name="Plus" />
        <span>{{ $t('panel.addForm') }}</span>
      </n-button>
    </div>
    <n-modal
      v-model:show="showModal"
      :style="{ width: '80%', height: '650px' }"
      :mask-closable="false"
      preset="dialog"
      title="表单"
      positive-text="确认"
      @positive-click="onPositiveClick"
    >
      <form-selector ref="formSelectRef" :selected="data"></form-selector>
    </n-modal>
  </n-collapse-item>
</template>

<script lang="ts" setup>
  import { h, onBeforeUnmount, onMounted, ref, toRaw } from 'vue'
  import modelerStore from '@/store/modeler'
  import { NButton } from 'naive-ui'
  import { useI18n } from 'vue-i18n'
  import FormSelector from '@/components/Panel/components/SubChild/FormSelector.vue'
  import { getTaskForms, setTaskForms } from '@/bo-utils/taskUtil'
  import { Base } from 'diagram-js/lib/model'
  import { isUserTask } from '@/bo-utils/conditionUtil'
  import axios from '@/axios'
  import EventEmitter from '@/utils/EventEmitter'
  import { debounce } from 'min-dash'

  const { t } = useI18n()

  const modeler = modelerStore()

  const value = ref<string>('1')
  const showModal = ref<boolean>(false)

  let data = ref([] as any[])
  const formColumns = [
    {
      title: '序号',
      key: 'code',
      width: 54,
      render: (row, index) => {
        return index + 1
      }
    },
    {
      title: '名称',
      key: 'name'
    },
    {
      title: '代码',
      key: 'code',
      minWidth: 300
    },
    {
      title: t('panel.operations'),
      key: 'operation',
      align: 'center',
      render: (row, index) =>
        h(
          NButton,
          {
            quaternary: true,
            size: 'small',
            type: 'error',
            onClick: () => deleteForm(index)
          },
          { default: () => t('panel.remove') }
        )
    }
  ]

  const formSelectRef = ref<any>(null)

  const onPositiveClick = () => {
    data.value.splice(0, data.value.length)
    toRaw(formSelectRef.value.selected).forEach((d) => {
      data.value.push(d)
    })
    setTaskForms(
      modeler.getActive as Base,
      formSelectRef.value.selected.flatMap((d) => d.code).join(',')
    )
    showModal.value = false
  }

  const deleteForm = (index) => {
    data.value.splice(index, 1)
    setTaskForms(modeler.getActive as Base, data.value.flatMap((d) => d.code).join(','))
  }

  const getForms = (codes: string[]) => {
    const queryOptions = {
      conditionGroup: {
        conditions: [{ property: 'code', value: codes, operator: 'IN' }],
        queryRelation: 'AND'
      },
      orderBys: [{ property: 'sort', direction: 'desc' }]
    }
    return axios.get('/workflow/rest/forms', {
      params: {
        queryOptions: JSON.stringify(queryOptions)
      }
    })
  }

  const reloadFormData = debounce(() => {
    if (isUserTask(modeler.getActive)) {
      const formKeys = getTaskForms(modeler.getActive as Base)
      if (formKeys) {
        const formKeysArray = formKeys.split(',')
        if (formKeysArray.length > 0) {
          getForms(formKeysArray).then((response) => {
            data.value.splice(0, data.value.length)
            response.data.content.forEach((d) => {
              data.value.push({
                id: d.id,
                name: d.name,
                code: d.code
              })
            })
          })
        }
      } else {
        data.value.splice(0, data.value.length)
      }
    }
  }, 100)

  onMounted(() => {
    reloadFormData()
    EventEmitter.on('element-update', reloadFormData)
  })

  onBeforeUnmount(() => {
    EventEmitter.removeListener('element-update', reloadFormData)
  })
</script>
