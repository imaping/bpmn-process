<script lang="ts" setup>
  import { h, onMounted, reactive, ref, toRaw } from 'vue'
  import { NButton, NDescriptions, NDescriptionsItem, NEllipsis, TreeOption } from 'naive-ui'
  import { useI18n } from 'vue-i18n'
  import axios from '@/axios'

  const { t } = useI18n()

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

  const emit = defineEmits(['on-organization-change'])

  const selected = ref<Array<any>>(JSON.parse(JSON.stringify(toRaw(props.selected))))

  const districtPattern = ref('')
  const organizationPattern = ref('')

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
              organizationCheckedKeys.value.splice(
                organizationCheckedKeys.value.findIndex((d) => d === row.id),
                1
              )
              selected.value.splice(index, 1)
            }
          },
          { default: () => t('panel.remove') }
        )
    }
  ]

  let districtData = ref([])
  let organizationData = ref([])

  const districtSelectedKeys = reactive([])
  let organizationSelectedKeys = reactive([])
  let organizationCheckedKeys = ref([])
  organizationCheckedKeys.value = selected.value.map((d) => d.id)

  const getDistrict = () => {
    const queryOptions = {
      conditionGroup: { conditions: [], queryRelation: 'AND' },
      orderBys: [{ property: 'sort', direction: 'desc' }]
    }
    axios
      .get('/management/rest/districts', {
        params: {
          queryOptions: JSON.stringify(queryOptions)
        }
      })
      .then((response) => {
        if (response.data.status === 1) {
          districtData.value = response.data.content
          districtSelectedKeys[0] = response.data?.content[0]?.id || ''
          getOrganizations(response.data?.content[0]?.code)
        }
      })
  }

  const getOrganizations = (districtCode: string) => {
    const queryOptions = {
      conditionGroup: {
        conditions: [{ property: 'districtCode', value: districtCode, operator: 'EQ' }],
        queryRelation: 'AND'
      },
      orderBys: [{ property: 'sort', direction: 'desc' }]
    }

    axios
      .get('/management/rest/organizations', {
        params: {
          queryOptions: JSON.stringify(queryOptions)
        }
      })
      .then((response) => {
        if (response.data.status === 1) {
          organizationData.value = response.data.content
          organizationSelectedKeys[0] = response.data?.content[0]?.id || ''
          if (response.data.content.length > 0) {
            emit('on-organization-change', {
              id: response.data.content[0].id,
              name: response.data.content[0].name,
              code: response.data.content[0].code
            })
          } else {
            emit('on-organization-change', undefined)
          }
        }
      })
  }

  const districtNodeProps = ({ option }: { option: TreeOption }) => {
    return {
      onClick() {
        districtSelectedKeys.splice(0, districtSelectedKeys.length)
        districtSelectedKeys.push(option.id)
        getOrganizations(option.code as string)
      }
    }
  }
  const organizationProps = ({ option }: { option: TreeOption }) => {
    return {
      onClick() {
        organizationSelectedKeys.splice(0, organizationSelectedKeys.length)
        organizationSelectedKeys.push(option.id)
        emit('on-organization-change', {
          id: option.id,
          name: option.name,
          code: option.code
        })
      }
    }
  }

  const renderLabel = (info) => {
    return h(
      NEllipsis,
      {
        style: {
          maxWidth: '230px'
        }
      },
      { default: () => info.option.name }
    )
  }

  const updateOrganizationCheckedKeys = (keys, options, meta) => {
    organizationCheckedKeys.value = keys
    if (meta.action === 'check') {
      selected.value.push({ name: meta.node.name, code: meta.node.code, id: meta.node.id })
    } else {
      selected.value.splice(
        selected.value.findIndex((d) => d.code === meta.node.code),
        1
      )
    }
  }

  onMounted(() => {
    getDistrict()
  })

  defineExpose({
    selected
  })
</script>

<template>
  <n-grid cols="12" :style="{ marginTop: '15px', marginBottom: '15px' }">
    <n-grid-item :span="props.checkable ? 3 : 6">
      <n-descriptions label-placement="top" bordered>
        <n-descriptions-item>
          <template #label>行政区</template>
          <n-input
            v-model:value="districtPattern"
            clearable
            placeholder="搜索"
            style="margin-bottom: 5px"
          />
          <n-tree
            style="height: 530px; width: 100%"
            :pattern="districtPattern"
            :show-irrelevant-nodes="false"
            :data="districtData"
            virtual-scroll
            key-field="id"
            label-field="name"
            children-field="children"
            :node-props="districtNodeProps"
            :selected-keys="districtSelectedKeys"
            :render-label="renderLabel"
            default-expand-all
          />
        </n-descriptions-item>
      </n-descriptions>
    </n-grid-item>
    <n-grid-item :span="props.checkable ? 5 : 6">
      <n-descriptions label-placement="top" bordered>
        <n-descriptions-item>
          <template #label>组织机构</template>
          <span v-if="organizationData.length > 0">
            <n-input
              v-model:value="organizationPattern"
              clearable
              placeholder="搜索"
              style="margin-bottom: 5px"
            />
            <n-tree
              style="height: 530px; width: 100%"
              :pattern="organizationPattern"
              :show-irrelevant-nodes="false"
              :data="organizationData"
              virtual-scroll
              key-field="id"
              label-field="name"
              children-field="children"
              :node-props="organizationProps"
              :selected-keys="organizationSelectedKeys"
              :render-label="renderLabel"
              :checked-keys="organizationCheckedKeys"
              :checkable="props.checkable"
              default-expand-all
              @update:checked-keys="updateOrganizationCheckedKeys"
            />
          </span>
          <div v-else class="empty-data">
            <n-empty description="暂无数据"></n-empty>
          </div>
        </n-descriptions-item>
      </n-descriptions>
    </n-grid-item>
    <n-grid-item v-if="props.checkable" span="4" style="margin-left: 20px">
      <n-data-table
        flex-height
        style="height: 602px"
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
    height: 530px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
