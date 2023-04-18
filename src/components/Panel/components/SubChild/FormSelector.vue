<script lang="ts" setup>
  import { h, onMounted, reactive, ref, toRaw } from 'vue'
  import { NButton, NCheckbox, NTag, TreeOption } from 'naive-ui'
  import { useI18n } from 'vue-i18n'
  import axios from '@/axios'

  const { t } = useI18n()

  let treeData = ref([])

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
                code: rowData.code,
                name: rowData.name
              })
            } else {
              const index = selected.findIndex((d) => d.code === rowData.code)
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
      title: '代码',
      key: 'code'
    },
    {
      title: '类型',
      key: 'type',
      render: (row, index) => {
        if (row.type) {
          return h(
            NTag,
            {
              type: 'info',
              bordered: false
            },
            {
              default: () => '三方'
            }
          )
        }
        return h(
          NTag,
          {
            type: 'success',
            bordered: false
          },
          {
            default: () => '内置'
          }
        )
      }
    }
  ]

  const formSelectColumns = [
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
              const form = tableData.value.findLast((p) => p.code === row.code)
              if (form) {
                form.checked = false
              }
            }
          },
          { default: () => t('panel.remove') }
        )
    }
  ]

  const defaultSelectedKeys = reactive([])

  let tableData = ref([])

  const getFormsCategory = () => {
    axios
      .get('/workflow/rest/forms-category', {
        params: {
          queryOptions: '{}'
        }
      })
      .then((response) => {
        if (response.data.status === 1) {
          treeData.value = response.data.content
          defaultSelectedKeys.push(response.data?.content[0]?.id)
          getForms(response.data?.content[0]?.id)
        }
      })
  }

  const getForms = (categoryId: string) => {
    const queryOptions = {
      conditionGroup: {
        conditions: [{ property: 'categoryId', value: categoryId, operator: 'EQ' }],
        queryRelation: 'AND'
      },
      orderBys: [{ property: 'sort', direction: 'desc' }]
    }
    axios
      .get('/workflow/rest/forms', {
        params: {
          queryOptions: JSON.stringify(queryOptions)
        }
      })
      .then((response) => {
        if (response.data.status === 1) {
          response.data.content.forEach(
            (data) => (data.checked = selected.findIndex((d) => d.code === data.code) > -1)
          )
          tableData.value = response.data.content
        }
      })
  }

  const nodeProps = ({ option }: { option: TreeOption }) => {
    return {
      onClick() {
        defaultSelectedKeys.splice(0, defaultSelectedKeys.length)
        defaultSelectedKeys.push(option.id)
        getForms(option.id as string)
      }
    }
  }

  onMounted(() => {
    getFormsCategory()
  })

  type Form = {
    id: string
    name: string
    code: string
  }

  const props = withDefaults(
    defineProps<{
      selected: Array<Form>
    }>(),
    {
      selected: () => []
    }
  )
  const selected = reactive<Array<Form>>(JSON.parse(JSON.stringify(toRaw(props.selected))))

  defineExpose({
    selected
  })
</script>

<template>
  <n-grid cols="7" :style="{ marginTop: '15px', marginBottom: '15px' }" :x-gap="12">
    <n-grid-item span="1">
      <n-tree
        style="height: 530px"
        :data="treeData"
        virtual-scroll
        key-field="id"
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
        :data="tableData"
        :bordered="false"
      />
    </n-grid-item>
    <n-grid-item span="2">
      <n-data-table
        flex-height
        style="height: 530px"
        :columns="formSelectColumns"
        :data="selected"
        :bordered="false"
      />
    </n-grid-item>
  </n-grid>
</template>
