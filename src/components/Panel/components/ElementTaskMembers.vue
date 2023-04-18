<template>
  <n-collapse-item name="element-task-back">
    <template #header>
      <collapse-title :title="$t('panel.taskMember')">
        <lucide-icon name="User" />
      </collapse-title>
    </template>
    <div class="element-extension-task-back">
      <edit-item key="allowBack" label="人员配置">
        <n-input-group>
          <n-input :style="{ width: '70%', marginRight: '10px' }" placeholder="" disabled />
          <n-button type="primary" ghost @click="showModal = true"> 编辑</n-button>
        </n-input-group>
      </edit-item>
    </div>
    <n-modal
      v-model:show="showModal"
      :style="{ width: '860px', height: '500px' }"
      :mask-closable="false"
      preset="dialog"
      title="人员配置"
      positive-text="确认"
      @positive-click="onPositiveClick"
    >
      <n-button type="info" :style="{ marginBottom: '10px' }" @click="addRule"> 新增</n-button>
      <n-data-table
        flex-height
        :style="{ height: '320px' }"
        :bordered="true"
        resizable
        :single-line="false"
        :columns="columns"
        :data="data"
      />
    </n-modal>
  </n-collapse-item>
</template>

<script lang="ts" setup>
  import { h, onMounted, reactive, ref } from 'vue'
  import modelerStore from '@/store/modeler'
  import EventEmitter from '@/utils/EventEmitter'
  import type { DataTableColumns } from 'naive-ui'
  import { NButton, NInput, NSelect } from 'naive-ui'

  const modeler = modelerStore()

  const value = ref<string>('1')
  const showModal = ref<boolean>(false)

  type RuleData = {
    type: string
    value: string
    operator: string
  }

  const data: RuleData[] = reactive([
    {
      type: 'user',
      value: '',
      operator: 'or'
    }
  ])
  const columns: DataTableColumns<RuleData> = [
    {
      title: '序号',
      key: 'type',
      width: 55,
      render: (row, index) => {
        return index + 1
      }
    },
    {
      title: '用户类型',
      key: 'type',
      render(row, index) {
        return h(NSelect, {
          value: row.type,
          options: [
            {
              label: '用户',
              value: 'user'
            },
            {
              label: '角色',
              value: 'role'
            },
            {
              label: '部门',
              value: 'department'
            },
            {
              label: '组织机构',
              value: 'organization'
            },
            {
              label: '用户组',
              value: 'group'
            }
          ],
          onUpdateValue(v) {
            data[index].type = v
          }
        })
      }
    },
    {
      title: '用户',
      key: 'value',
      minWidth: 300
    },
    {
      title: '运算类型',
      key: 'operator',
      render(row, index) {
        if (index == 0) {
          return []
        }
        return [
          h(NSelect, {
            value: row.operator,
            options: [
              {
                label: '或',
                value: 'or'
              },
              {
                label: '与',
                value: 'and'
              },
              {
                label: '排除',
                value: 'diff'
              }
            ],
            onUpdateValue(v) {
              data[index].operator = v
            }
          })
        ]
      }
    },
    {
      title: '操作',
      key: 'order',
      width: 200,
      render(row, index) {
        return [
          h(
            NButton,
            {
              size: 'small',
              disabled: index == 0,
              onClick: () => moveUp(index)
            },
            { default: () => '上移' }
          ),
          h(
            NButton,
            {
              size: 'small',
              disabled: index == data.length - 1,
              onClick: () => moveDown(index)
            },
            { default: () => '下移' }
          ),
          h(
            NButton,
            {
              size: 'small',
              onClick: () => deleteRule(index)
            },
            { default: () => '删除' }
          )
        ]
      }
    }
  ]

  const onPositiveClick = () => {
    showModal.value = false
  }

  const addRule = () => {
    data.push({
      type: 'user',
      value: '',
      operator: 'or'
    })
  }

  const moveUp = (index) => {
    data.splice(index, 1, ...data.splice(index - 1, 1, data[index]))
    if (index - 1 === 0) {
      data[0].operator = 'or'
    }
  }

  const moveDown = (index) => {
    if (index === 0) {
      data[0].operator = 'or'
    }
    data.splice(index, 1, ...data.splice(index + 1, 1, data[index]))
  }

  const deleteRule = (index) => {
    data.splice(index, 1)
  }

  onMounted(() => {
    EventEmitter.on('element-update', () => {})
  })
</script>
