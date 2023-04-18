<template>
  <n-collapse-item name="element-attachment-form">
    <template #header>
      <collapse-title :title="$t('panel.attachmentForm')">
        <lucide-icon name="Paperclip" />
      </collapse-title>
    </template>
    <template #header-extra>
      <n-tag type="primary" round>
        {{ data.length }}
      </n-tag>
    </template>
    <div class="element-extension-attachment-form">
      <n-data-table size="small" max-height="20vh" :columns="tableColumns" :data="data" />

      <n-button type="info" class="inline-large-button" secondary @click="showModal = true">
        <lucide-icon :size="20" name="Plus" />
        <span>{{ $t('panel.addAttachment') }}</span>
      </n-button>
    </div>
    <n-modal
      v-model:show="showModal"
      :style="{ width: '80%', height: '650px' }"
      :mask-closable="false"
      preset="dialog"
      title="材料"
      positive-text="确认"
      @positive-click="onPositiveClick"
    >
      <attachment-selector ref="selectRef" :selected="data"></attachment-selector>
    </n-modal>
  </n-collapse-item>
</template>

<script lang="ts" setup>
  import { h, onMounted, ref, toRaw } from 'vue'
  import modelerStore from '@/store/modeler'
  import { NButton } from 'naive-ui'
  import { useI18n } from 'vue-i18n'
  import AttachmentSelector from '@/components/Panel/components/SubChild/AttachmentSelector.vue'
  import { getTaskAttachment, setTaskAttachment } from '@/bo-utils/taskUtil'
  import { Base } from 'diagram-js/lib/model'
  import { isUserTask } from '@/bo-utils/conditionUtil'
  import axios from '@/axios'

  const { t } = useI18n()

  const modeler = modelerStore()

  const value = ref<string>('1')
  const showModal = ref<boolean>(false)

  let data = ref([] as any[])
  const tableColumns = [
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
            onClick: () => deleteItem(index)
          },
          { default: () => t('panel.remove') }
        )
    }
  ]

  const selectRef = ref<any>(null)

  const onPositiveClick = () => {
    data.value.splice(0, data.value.length)
    toRaw(selectRef.value.selected).forEach((d) => {
      data.value.push(d)
    })
    setTaskAttachment(
      modeler.getActive as Base,
      selectRef.value.selected.flatMap((d) => d.code).join(',')
    )
    showModal.value = false
  }

  const deleteItem = (index) => {
    data.value.splice(index, 1)
    setTaskAttachment(modeler.getActive as Base, data.value.flatMap((d) => d.code).join(','))
  }

  const getData = (codes: string[]) => {
    const queryOptions = {
      conditionGroup: {
        conditions: [{ property: 'code', value: codes, operator: 'IN' }],
        queryRelation: 'AND'
      },
      orderBys: [{ property: 'sort', direction: 'desc' }]
    }
    return axios.get('/workflow/rest/material', {
      params: {
        queryOptions: JSON.stringify(queryOptions)
      }
    })
  }

  const reloadFormData = () => {
    if (isUserTask(modeler.getActive)) {
      const attachments = getTaskAttachment(modeler.getActive as Base)
      if (attachments) {
        const attachmentArray = attachments.split(',')
        if (attachmentArray.length > 0) {
          getData(attachmentArray).then((response) => {
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
      }
    }
  }

  onMounted(() => {
    reloadFormData()
  })
</script>
