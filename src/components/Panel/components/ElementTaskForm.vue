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

      <n-button type="info" class="inline-large-button" secondary>
        <lucide-icon :size="20" name="Plus" />
        <span>{{ $t('panel.addForm') }}</span>
      </n-button>
    </div>
    <n-modal
      v-model:show="showModal"
      :style="{ width: '860px', height: '500px' }"
      :mask-closable="false"
      preset="dialog"
      title="表单"
      positive-text="确认"
      @positive-click="onPositiveClick"
    >
    </n-modal>
  </n-collapse-item>
</template>

<script lang="ts" setup>
  import { h, onMounted, reactive, ref } from 'vue'
  import modelerStore from '@/store/modeler'
  import EventEmitter from '@/utils/EventEmitter'
  import { NButton } from 'naive-ui'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  const modeler = modelerStore()

  const value = ref<string>('1')
  const showModal = ref<boolean>(false)

  type FormData = {
    code: string
    name: string
  }

  const data: FormData[] = reactive([
    {
      code: '123',
      name: '中国'
    }
  ])
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

  const onPositiveClick = () => {
    showModal.value = false
  }

  const deleteForm = (index) => {
    data.splice(index, 1)
  }

  onMounted(() => {
    EventEmitter.on('element-update', () => {})
  })
</script>
