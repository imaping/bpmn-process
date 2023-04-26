<script lang="ts" setup>
  import { computed, h, ref, toRaw } from 'vue'
  import { DataTableColumns, NButton, NCheckbox } from 'naive-ui'
  import { useI18n } from 'vue-i18n'
  import axios from '@/axios'
  import DepartmentSelector from '@/components/Panel/components/SubChild/DepartmentSelector.vue'

  const { t } = useI18n()

  const props = withDefaults(
    defineProps<{
      selected: Array<any>
      multiple: boolean
    }>(),
    {
      selected: () => [],
      multiple: false
    }
  )

  const selected = ref<Array<any>>(JSON.parse(JSON.stringify(toRaw(props.selected))))
  selected.value.map((d) => (d.loginName = d.code))

  const isMultiple = computed(() => {
    return props.multiple
  })

  const userColumns = computed(() => {
    const baseUserColumns: DataTableColumns<any> = [
      {
        title: '姓名',
        key: 'name'
      },
      {
        title: '用户名',
        key: 'loginName'
      },
      {
        title: '职务',
        key: 'jobLevel'
      }
    ]
    if (isMultiple.value) {
      baseUserColumns.unshift({
        title: '',
        width: 32,
        key: 'checked',
        render: (rowData) => {
          return h(NCheckbox, {
            checked: rowData.checked,
            'onUpdate:checked'(checked: boolean) {
              rowData.checked = checked
              if (checked) {
                selected.value.push({
                  id: rowData.id,
                  loginName: rowData.loginName,
                  name: rowData.name,
                  code: rowData.loginName
                })
              } else {
                const index = selected.value.findIndex((d) => d.loginName === rowData.loginName)
                if (index > -1) {
                  selected.value.splice(index, 1)
                }
              }
            }
          })
        }
      })
    } else {
      baseUserColumns.unshift({
        type: 'selection',
        multiple: false
      })
    }
    return baseUserColumns
  })

  const userSelectColumns = [
    {
      title: '名称',
      key: 'loginName',
      render: (row) => h('span', {}, row.name + '(' + row.loginName + ')')
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
              selected.value.splice(index, 1)
              const data = userData.value.findLast((p) => p.loginName === row.loginName)
              if (data) {
                data.checked = false
              }
            }
          },
          { default: () => t('panel.remove') }
        )
    }
  ]

  let userData = ref([])

  const userRowKey = (row) => row.loginName

  const getUser = (organizationId: string, departmentId: string) => {
    const queryOptions = {
      conditionGroup: {
        conditions: [
          {
            property: 'organizationId',
            value: organizationId,
            operator: 'EQ'
          },
          {
            property: 'departmentId',
            value: departmentId,
            operator: 'EQ'
          }
        ],
        queryRelation: 'AND'
      },
      orderBys: [{ property: 'sort', direction: 'desc' }]
    }

    axios
      .get('/management/rest/users', {
        params: {
          queryOptions: JSON.stringify(queryOptions)
        }
      })
      .then((response) => {
        if (response.data.status === 1) {
          if (isMultiple.value) {
            response.data.content.forEach(
              (data) =>
                (data.checked =
                  selected.value.findIndex((d) => d.loginName === data.loginName) > -1)
            )
          }
          userData.value = response.data.content
        }
      })
  }

  const handleUserCheck = (rowKeys) => {
    if (isMultiple.value) {
      selected.value = selected.value.concat(rowKeys)
    } else {
      selected.value.splice(0, selected.value.length)
      const find = userData.value.find((d) => d.loginName === rowKeys[0])
      userSelectString.value = `已选择用户:  ${find.name}(${find.loginName})`
    }
    selected.value = selected.value.concat(rowKeys)
  }

  const userSelectString = ref<string>('已选择用户: 暂无')

  const onDepartmentChange = (data) => {
    if (data === undefined) {
      userData.value = []
      return
    }
    getUser(data.organizationId, data.id)
  }

  defineExpose({
    selected
  })
</script>

<template>
  <n-grid cols="16" :style="{ marginTop: '15px', marginBottom: '15px' }">
    <n-grid-item
      v-if="!isMultiple"
      :offset="11"
      span="5"
      style="margin-bottom: 15px; text-align: right"
      >{{ userSelectString }}</n-grid-item
    >
    <n-grid-item span="9">
      <department-selector
        :checkable="false"
        @on-department-change="onDepartmentChange"
      ></department-selector>
    </n-grid-item>
    <n-grid-item :span="isMultiple ? 4 : 7" style="margin-top: 15px">
      <n-data-table
        :row-key="userRowKey"
        flex-height
        style="height: 642px"
        :columns="userColumns"
        :data="userData"
        bordered
        @update-checked-row-keys="handleUserCheck"
      >
        <template #empty>
          <n-empty description="暂无数据"></n-empty>
        </template>
      </n-data-table>
    </n-grid-item>
    <n-grid-item v-if="isMultiple" span="3" style="margin-top: 15px; margin-left: 15px">
      <n-data-table
        flex-height
        style="height: 642px"
        :columns="userSelectColumns"
        :data="selected"
        bordered
      >
        <template #empty>
          <n-empty description="暂无数据"></n-empty>
        </template>
      </n-data-table>
    </n-grid-item>
  </n-grid>
</template>
<style scoped></style>
