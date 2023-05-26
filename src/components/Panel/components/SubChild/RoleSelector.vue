<script lang="ts" setup>
  import { h, onMounted, reactive, ref, toRaw } from 'vue'
  import { DataTableRowKey, NButton, NCheckbox, NTooltip } from 'naive-ui'
  import { useI18n } from 'vue-i18n'
  import axios from '@/axios'

  const { t } = useI18n()

  let categoryData = [
    {
      value: 1,
      name: '系统内置'
    },
    {
      value: 2,
      name: '公共角色'
    }
  ]

  const tableColumns = [
    {
      title: '',
      width: 32,
      key: 'checked',
      render: (rowData) => {
        return h(NCheckbox, {
          checked: rowData.checked,
          'onUpdate:checked'(checked: boolean) {
            rowData.checked = checked
            if (checked) {
              selected.push({
                id: rowData.id,
                code: rowData.type,
                type: rowData.type,
                name: rowData.name
              })
            } else {
              const index = selected.findIndex((d) => d.code === rowData.type)
              if (index > -1) {
                selected.splice(index, 1)
              }
            }
          }
        })
      }
    },
    {
      title: '名称',
      key: 'name'
    },
    {
      title: '类别',
      key: 'type'
    },
    {
      title: '描述',
      key: 'description'
    }
  ]

  const selectColumns = [
    {
      title: '名称',
      key: 'code',
      render: (row, index) => h('span', {}, row.name + '(' + row.code + ')')
    },
    {
      title: '操作',
      key: 'value',
      align: 'center',
      render: (row, index) =>
        h(
          NButton,
          {
            quaternary: true,
            size: 'small',
            type: 'error',
            onClick: () => {
              selected.splice(index, 1)
              const role = tableData.value.findLast((p) => p.code === row.code)
              if (role) {
                role.checked = false
              }
            }
          },
          { default: () => t('panel.remove') }
        )
    }
  ]

  const defaultSelectedKeys = ref<Array<number>>([1])

  let tableData = ref([])

  const getRoles = (categoryId: number) => {
    const queryOptions = {
      conditionGroup: {
        conditions: [{ property: 'category', value: categoryId, operator: 'EQ' }],
        queryRelation: 'AND'
      },
      orderBys: [{ property: 'sort', direction: 'desc' }]
    }
    axios
      .get('/management/rest/roles', {
        params: {
          queryOptions: JSON.stringify(queryOptions)
        }
      })
      .then((response) => {
        if (response.data.status === 1) {
          response.data.content.forEach(
            (data) => (data.checked = selected.findIndex((d) => d.code === data.type) > -1)
          )
          tableData.value = response.data.content
        }
      })
  }

  const nodeProps = (option) => {
    return {
      onClick() {
        defaultSelectedKeys.value = []
        defaultSelectedKeys.value.push(option.option.value)
        getRoles(option.option.value)
      }
    }
  }

  onMounted(() => {
    getRoles(1)
  })

  type Role = {
    id: string
    name: string
    code: string
  }

  const props = withDefaults(
    defineProps<{
      selected: Array<Role>
    }>(),
    {
      selected: () => []
    }
  )
  const selected = reactive<Array<Role>>(JSON.parse(JSON.stringify(toRaw(props.selected))))

  defineExpose({
    selected
  })
</script>

<template>
  <n-grid cols="7" :style="{ marginTop: '15px', marginBottom: '15px' }" :x-gap="12">
    <n-grid-item span="1">
      <n-tree
        style="height: 530px"
        :data="categoryData"
        virtual-scroll
        key-field="value"
        label-field="name"
        children-field="children"
        :node-props="nodeProps"
        :selected-keys="defaultSelectedKeys"
        default-expand-all
      />
    </n-grid-item>
    <n-grid-item span="4">
      <n-data-table
        flex-height
        style="height: 530px"
        :columns="tableColumns"
        :row-key="(row) => row.id"
        :data="tableData"
        :bordered="false"
      />
    </n-grid-item>
    <n-grid-item span="2">
      <n-data-table
        flex-height
        style="height: 530px"
        :columns="selectColumns"
        :data="selected"
        :bordered="false"
      />
    </n-grid-item>
  </n-grid>
</template>
<style scoped>
  :deep(.n-data-table-th--selection .n-checkbox-box) {
    visibility: hidden;
  }
</style>
