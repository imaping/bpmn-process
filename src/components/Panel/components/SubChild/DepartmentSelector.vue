<script lang="ts" setup>
  import OrganizationSelector from '@/components/Panel/components/SubChild/OrganizationSelector.vue'
  import { NButton, NDescriptions, NDescriptionsItem, NEllipsis, TreeOption } from 'naive-ui'
  import { h, ref, toRaw } from 'vue'
  import axios from '@/axios'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  const departmentData = ref([])
  const departmentSelectedKeys = ref([])
  const departmentPattern = ref('')
  const departmentCheckedKeys = ref([])

  const emit = defineEmits(['on-department-change'])

  const props = withDefaults(
    defineProps<{
      selected: Array<any>
      checkable: boolean
    }>(),
    {
      selected: () => [],
      checkable: true
    }
  )

  const selected = ref<Array<any>>(JSON.parse(JSON.stringify(toRaw(props.selected))))
  departmentCheckedKeys.value = selected.value.map((d) => d.id)

  const selectColumns = [
    {
      title: '已选择',
      key: 'name',
      ellipsis: {
        tooltip: true
      },
      render: (row) => h('span', {}, row.name + '(' + row.code + ')')
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
              departmentCheckedKeys.value.splice(
                departmentCheckedKeys.value.findIndex((d) => d === row.code),
                1
              )
              selected.value.splice(index, 1)
              const data = departmentData.value.findLast((p) => p.id === row.id)
              if (data) {
                data.checked = false
              }
            }
          },
          { default: () => t('panel.remove') }
        )
    }
  ]

  const departmentProps = ({ option }: { option: TreeOption }) => {
    return {
      onClick() {
        departmentSelectedKeys.value = []
        departmentSelectedKeys.value.push(option.id)
        emit('on-department-change', {
          organizationId: currentOrganizationId,
          id: option.id,
          name: option.name,
          code: option.code
        })
      }
    }
  }

  let currentOrganizationId = undefined

  const onOrganizationChange = (organization) => {
    currentOrganizationId = organization?.id
    getDepartment(organization?.id)
  }

  const getDepartment = (organizationId: string | undefined) => {
    departmentSelectedKeys.value = []
    if (!organizationId && organizationId !== '') {
      departmentData.value = []
      emit('on-department-change', undefined)
      return
    }
    const queryOptions = {
      conditionGroup: {
        conditions: [
          {
            property: 'organizationId',
            value: organizationId,
            operator: 'EQ'
          }
        ],
        queryRelation: 'AND'
      },
      orderBys: [{ property: 'sort', direction: 'desc' }]
    }

    axios
      .get('/management/rest/departments', {
        params: {
          queryOptions: JSON.stringify(queryOptions)
        }
      })
      .then((response) => {
        if (response.data.status === 1) {
          departmentData.value = response.data.content
          if (response.data.content.length > 0) {
            departmentSelectedKeys.value.push(response.data.content[0].id)
            emit('on-department-change', {
              organizationId,
              id: response.data.content[0].id,
              name: response.data.content[0].name,
              code: response.data.content[0].code
            })
          } else {
            emit('on-department-change', undefined)
          }
        }
      })
  }
  const renderLabel = (info) => {
    return h(
      NEllipsis,
      {
        style: {
          maxWidth: '110px'
        }
      },
      { default: () => info.option.name }
    )
  }

  const updateDepartmentCheckedKeys = (keys, options, meta) => {
    departmentCheckedKeys.value = keys
    if (meta.action === 'check') {
      selected.value.push({ name: meta.node.name, code: meta.node.code, id: meta.node.id })
    } else {
      selected.value.splice(
        selected.value.findIndex((d) => d.code === meta.node.code),
        1
      )
    }
  }

  defineExpose({
    selected
  })
</script>

<template>
  <n-grid cols="12">
    <n-grid-item :span="props.checkable ? 6 : 8">
      <organization-selector
        :checkable="false"
        @on-organization-change="onOrganizationChange"
      ></organization-selector>
    </n-grid-item>
    <n-grid-item
      :span="props.checkable ? 3 : 4"
      :style="{ marginTop: '15px', marginBottom: '15px' }"
    >
      <n-descriptions label-placement="top" bordered style="height: 530px !important">
        <n-descriptions-item>
          <template #label>部门</template>
          <span v-if="departmentData.length > 0">
            <n-input
              v-model:value="departmentPattern"
              clearable
              placeholder="搜索"
              style="margin-bottom: 5px"
            />
            <n-tree
              style="height: 530px"
              :pattern="departmentPattern"
              :show-irrelevant-nodes="false"
              :data="departmentData"
              virtual-scroll
              key-field="id"
              label-field="name"
              children-field="children"
              :node-props="departmentProps"
              :selected-keys="departmentSelectedKeys"
              :render-label="renderLabel"
              :checked-keys="departmentCheckedKeys"
              :checkable="props.checkable"
              default-expand-all
              @update:checked-keys="updateDepartmentCheckedKeys"
            />
          </span>
          <div v-else class="empty-data">
            <n-empty description="暂无数据"></n-empty>
          </div>
        </n-descriptions-item>
      </n-descriptions>
    </n-grid-item>
    <n-grid-item v-if="props.checkable" span="3" :style="{ marginTop: '15px', marginLeft: '20px' }">
      <n-data-table
        flex-height
        style="height: 640px"
        :columns="selectColumns"
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
<style scoped>
  .empty-data {
    height: 570px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
