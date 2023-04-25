<script lang="ts" setup>
  import { computed, onMounted, reactive, ref, toRaw, unref } from 'vue'
  import { TreeOption } from 'naive-ui'
  import { useI18n } from 'vue-i18n'
  import axios from '@/axios'
  import modeler from '@/store/modeler'
  import { isUserTask } from '@/bo-utils/conditionUtil'
  import EventEmitter from "@/utils/EventEmitter";

  const { t } = useI18n()

  const modelerStore = modeler()
  const getActive = computed(() => modelerStore.getActive!)

  let treeData = ref([])

  const tableColumns = [
    {
      title: '',
      width: 32,
      type: 'selection',
      multiple: false
    },
    {
      title: '名称',
      key: 'name'
    },
    {
      title: '代码',
      key: 'code'
    },
    {
      title: '类型',
      key: 'eventType'
    },
    {
      title: '描述',
      key: 'description'
    }
  ]

  const categorySelectedKeys = reactive([])

  let tableData = ref([])

  const rowKey = (row) => row.id

  const listenerType = ref('start')

  const listenerTypeOptions = computed(() => {
    if (isUserTask(modelerStore.getActive)) {
      return [
        { label: '开始', value: 'start' },
        { label: '结束', value: 'end' },
        { label: '连线', value: 'take' },
        { label: '创建', value: 'create' },
        { label: '指派', value: 'assignment' },
        { label: '完成', value: 'complete' },
        { label: '删除', value: 'delete' }
      ]
    }
    return [
      { label: '开始', value: 'start' },
      { label: '结束', value: 'end' },
      { label: '连线', value: 'take' }
    ]
  })

  const getCategory = () => {
    axios
      .get('/workflow/rest/event-category', {
        params: {
          queryOptions: '{}'
        }
      })
      .then((response) => {
        if (response.data.status === 1) {
          treeData.value = response.data.content
          categorySelectedKeys.push(response.data?.content[0]?.id)
          getCategoryItems(response.data?.content[0]?.id)
        }
      })
  }

  const getCategoryItems = (categoryId: string) => {
    const queryOptions = {
      conditionGroup: {
        conditions: [{ property: 'categoryId', value: categoryId, operator: 'EQ' }],
        queryRelation: 'AND'
      },
      orderBys: [{ property: 'sort', direction: 'desc' }]
    }
    axios
      .get('/workflow/rest/event', {
        params: {
          queryOptions: JSON.stringify(queryOptions)
        }
      })
      .then((response) => {
        if (response.data.status === 1) {
          tableData.value = response.data.content
        }
      })
  }

  const nodeProps = ({ option }: { option: TreeOption }) => {
    return {
      onClick() {
        categorySelectedKeys.splice(0, categorySelectedKeys.length)
        categorySelectedKeys.push(option.id)
        getCategoryItems(option.id as string)
      }
    }
  }

  const eventCheckedIds = ref([])
  const eventChecked = ref({})

  const handleCheck = (rowKeys) => {
    eventCheckedIds.value = rowKeys
    if (rowKeys.length > 0) {
      const value = tableData.value.find((d) => d.id === rowKeys[0])
      if (value) {
        eventChecked.value = toRaw(value)
        const categoryValue = treeData.value.find((d) => d.id === categorySelectedKeys[0])
        selectComputed.value = `已选择事件: ${categoryValue.name} => ${value.name}(${value.code})`
        return
      }
    }
    selectComputed.value = ''
  }

  const selectComputed = ref('')

  const getData = (callBack) => {
    const { id, eventType, code } = unref(eventChecked)
    const listenerTypeLabel = listenerTypeOptions.value.find(
      (d) => d.value === listenerType.value
    )?.label
    const result = {
      id,
      eventType,
      code,
      listenerType: unref(listenerType),
      listenerTypeLabel: listenerTypeLabel
    }
    callBack(result)
  }

  defineExpose({
    getData
  })

  onMounted(() => {
    getCategory()
  })
</script>

<template>
  <n-grid cols="7" :style="{ marginTop: '25px', marginBottom: '' }" :x-gap="12" :y-gap="24">
    <n-grid-item :offset="1" span="4">
      <edit-item label="事件类型">
        <n-select v-model:value="listenerType" :options="listenerTypeOptions" />
      </edit-item>
    </n-grid-item>
    <n-grid-item span="2" style="text-align: right; padding: 6px 0">
      {{ selectComputed }}
    </n-grid-item>
    <n-grid-item span="1">
      <n-tree
        style="height: 450px"
        :data="treeData"
        virtual-scroll
        key-field="id"
        label-field="name"
        children-field="children"
        :node-props="nodeProps"
        :selected-keys="categorySelectedKeys"
        default-expand-all
      />
    </n-grid-item>
    <n-grid-item span="6">
      <n-data-table
        :row-key="rowKey"
        flex-height
        style="height: 450px"
        :columns="tableColumns"
        :data="tableData"
        :bordered="false"
        @update-checked-row-keys="handleCheck"
      />
    </n-grid-item>
  </n-grid>
</template>
