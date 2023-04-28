<script lang="ts" setup>
  import { h, onMounted, reactive, ref, toRaw } from 'vue'
  import { NCheckbox, NTag } from 'naive-ui'
  import { useI18n } from 'vue-i18n'
  import axios from '@/axios'

  const { t } = useI18n()

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
      title: '描述',
      key: 'description'
    }
  ]

  let tableData = ref([])

  const getGroups = () => {
    const queryOptions = {
      conditionGroup: {
        conditions: [
          { property: 'code', value: 'ACTIVITY_%', operator: 'NLIKE' },
          { property: 'code', value: 'FLOW_%', operator: 'NLIKE' }
        ],
        queryRelation: 'AND'
      },
      orderBys: [{ property: 'sort', direction: 'desc' }]
    }
    axios
      .get('/workflow/rest/groups', {
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

  onMounted(() => {
    getGroups()
  })

  type UserGroup = {
    id: string
    name: string
    code: string
  }

  const props = withDefaults(
    defineProps<{
      selected: Array<UserGroup>
    }>(),
    {
      selected: () => []
    }
  )
  const selected = reactive<Array<UserGroup>>(JSON.parse(JSON.stringify(toRaw(props.selected))))

  defineExpose({
    selected
  })
</script>

<template>
  <n-data-table
    flex-height
    style="height: 530px"
    :columns="tableColumns"
    :data="tableData"
    :bordered="false"
  />
</template>
