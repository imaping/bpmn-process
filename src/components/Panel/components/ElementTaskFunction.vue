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
    <div class="element-extension-task-form">
      <n-data-table size="small" max-height="20vh" :columns="formColumns" :data="data" />

      <n-button type="info" class="inline-large-button" secondary @click="showModal = true">
        <lucide-icon :size="20" name="Plus" />
        <span>{{ $t('panel.addFunction') }}</span>
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
      <function-selector ref="functionSelectRef" :selected="data"></function-selector>
    </n-modal>
  </n-collapse-item>
</template>

<script lang="ts" setup>
  import { h, onBeforeUnmount, onMounted, ref, toRaw } from 'vue'
  import modelerStore from '@/store/modeler'
  import { NButton } from 'naive-ui'
  import { useI18n } from 'vue-i18n'
  import FunctionSelector from '@/components/Panel/components/SubChild/FunctionSelector.vue'
  import { getTaskFunction, setTaskFunction } from '@/bo-utils/taskUtil'
  import { Base } from 'diagram-js/lib/model'
  import { isUserTask } from '@/bo-utils/conditionUtil'
  import axios from '@/axios'
  import EventEmitter from '@/utils/EventEmitter'
  import { debounce } from 'min-dash'

  const { t } = useI18n()

  const modeler = modelerStore()

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
            onClick: () => deleteFunction(index)
          },
          { default: () => t('panel.remove') }
        )
    }
  ]

  const functionSelectRef = ref<any>(null)

  const onPositiveClick = () => {
    data.value.splice(0, data.value.length)
    toRaw(functionSelectRef.value.selected).forEach((d) => {
      data.value.push(d)
    })
    setTaskFunction(
      modeler.getActive as Base,
      functionSelectRef.value.selected.flatMap((d) => d.code).join(',')
    )
    showModal.value = false
  }

  const deleteFunction = (index) => {
    data.value.splice(index, 1)
    setTaskFunction(modeler.getActive as Base, data.value.flatMap((d) => d.code).join(','))
  }

  const getFunctions = (codes: string[]) => {
    const queryOptions = {
      conditionGroup: {
        conditions: [{ property: 'code', value: codes, operator: 'IN' }],
        queryRelation: 'AND'
      },
      orderBys: [{ property: 'sort', direction: 'desc' }]
    }
    return axios.get('/workflow/rest/function', {
      params: {
        queryOptions: JSON.stringify(queryOptions)
      }
    })
  }

  const reloadFunctionData = debounce(() => {
    if (isUserTask(modeler.getActive)) {
      const functionKeys = getTaskFunction(modeler.getActive as Base)
      if (functionKeys) {
        const functionKeysArray = functionKeys.split(',')
        if (functionKeysArray.length > 0) {
          getFunctions(functionKeysArray).then((response) => {
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
    reloadFunctionData()
    EventEmitter.on('element-update', reloadFunctionData)
  })

  onBeforeUnmount(() => {
    EventEmitter.removeListener('element-update', reloadFunctionData)
  })
</script>
