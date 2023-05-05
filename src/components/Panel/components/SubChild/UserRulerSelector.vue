<script lang="ts" setup>
  import { h, ref, toRaw } from 'vue'
  import { DataTableColumns, NButton, NIcon, NPopover, NSelect } from 'naive-ui'
  import { ArrowDown, ArrowUp, Trash2 } from 'lucide-vue-next'
  import UserSelector from '@/components/Panel/components/SubChild/UserSelector.vue'
  import OrganizationSelector from '@/components/Panel/components/SubChild/OrganizationSelector.vue'
  import DepartmentSelector from '@/components/Panel/components/SubChild/DepartmentSelector.vue'
  import RoleSelector from '@/components/Panel/components/SubChild/RoleSelector.vue'
  import UserGroupSelector from '@/components/Panel/components/SubChild/UserGroupSelector.vue'
  import currentUser from '@/store/currentUser'

  const currentUserStore = currentUser()

  const showUserSelectorModal = ref<boolean>(false)
  const showOrganizationSelector = ref<boolean>(false)
  const showDepartmentSelector = ref<boolean>(false)
  const showRoleSelector = ref<boolean>(false)
  const showUserGroupSelector = ref<boolean>(false)
  const organizationSelectorRef = ref<any>(null)
  const departmentSelectorRef = ref<any>(null)
  const userSelectorRef = ref<any>(null)
  const roleSelectorRef = ref<any>(null)
  const userGroupSelectorRef = ref<any>(null)

  const currentSelectRowData = ref()

  const props = withDefaults(
    defineProps<{
      rules: Array<any> | undefined
    }>(),
    {
      rules: () => [
        {
          type: 'USER',
          value: [],
          operator: 'OR'
        }
      ]
    }
  )

  type RuleData = {
    type: string
    value: Array<any>
    operator: string
  }

  const rules = ref<Array<RuleData>>(JSON.parse(JSON.stringify(toRaw(props.rules))))
  const userTypeOptions = [
    {
      label: '指定用户',
      value: 'USER'
    },
    {
      label: '用户组',
      value: 'GROUP'
    },
    {
      label: '当前登录用户',
      value: 'CURRENTLOGINUSER'
    },
    {
      label: '流程发起人',
      value: 'INITIATOR'
    },
    {
      label: '角色',
      value: 'ROLE'
    },
    {
      label: '部门',
      value: 'DEPARTMENT'
    },
    {
      label: '组织机构',
      value: 'ORGANIZATION'
    }
  ]

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
      width: 160,
      render(row, index) {
        return h(NSelect, {
          value: row.type,
          options: userTypeOptions,
          onUpdateValue(v) {
            rules.value[index].type = v
            if (v === 'CURRENTLOGINUSER') {
              if (currentUserStore.isAuthenticated) {
                row.value = [
                  {
                    id: currentUserStore.getId,
                    loginName: currentUserStore.getLoginName,
                    name: currentUserStore.getName,
                    code: currentUserStore.getLoginName
                  }
                ]
              } else {
                row.value = []
              }
            } else if (v === 'INITIATOR') {
              row.value = [
                {
                  code: '${INITIATOR}',
                  name: '流程发起人'
                }
              ]
            } else {
              row.value = []
            }
            currentSelectRowData.value = undefined
          }
        })
      }
    },
    {
      title: '用户',
      key: 'type',
      minWidth: 300,
      ellipsis: {
        tooltip: true
      },
      render: (row, index) => {
        if (row.type === 'CURRENTLOGINUSER' || row.type === 'INITIATOR') {
          return h('span', {}, { default: () => renderSpan(row, index) })
        }
        return [
          h(
            NButton,
            {
              quaternary: false,
              size: 'small',
              type: 'primary',
              onClick: () => selectUserClick(row, index)
            },
            {
              default: () => '选择' + userTypeOptions.find((d) => d.value === row.type).label
            }
          ),
          h(
            'span',
            {
              style: {
                marginLeft: '3px'
              }
            },
            {
              default: () => renderSpan(row, index)
            }
          )
        ]
      }
    },
    {
      title: '运算类型',
      key: 'operator',
      width: 100,
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
                value: 'OR'
              },
              {
                label: '与',
                value: 'AND'
              },
              {
                label: '排除',
                value: 'DIFF'
              }
            ],
            onUpdateValue(v) {
              rules.value[index].operator = v
            }
          })
        ]
      }
    },
    {
      title: '操作',
      key: 'order',
      width: 110,
      render(row, index) {
        return [
          h(
            NPopover,
            {},
            {
              trigger: () =>
                h(
                  NButton,
                  {
                    quaternary: true,
                    circle: true,
                    size: 'small',
                    disabled: index == 0,
                    onClick: () => moveUp(index)
                  },
                  { icon: () => h(NIcon, null, { default: () => h(ArrowUp) }) }
                ),
              default: () => h('span', {}, { default: () => '上移' })
            }
          ),
          h(
            NPopover,
            {},
            {
              trigger: () =>
                h(
                  NButton,
                  {
                    quaternary: true,
                    circle: true,
                    size: 'small',
                    disabled: index == rules.value.length - 1,
                    onClick: () => moveDown(index)
                  },
                  { icon: () => h(NIcon, null, { default: () => h(ArrowDown) }) }
                ),
              default: () => h('span', {}, { default: () => '下移' })
            }
          ),
          h(
            NPopover,
            {},
            {
              trigger: () =>
                h(
                  NButton,
                  {
                    quaternary: true,
                    circle: true,
                    size: 'small',
                    onClick: () => deleteRule(index)
                  },
                  {
                    icon: () =>
                      h(NIcon, null, {
                        default: () =>
                          h(Trash2, {
                            color: 'red'
                          })
                      })
                  }
                ),
              default: () => h('span', {}, { default: () => '删除' })
            }
          )
        ]
      }
    }
  ]

  const addRule = () => {
    rules.value.push({
      type: 'USER',
      value: [],
      operator: 'OR'
    })
  }

  const renderSpan = (row, index) => {
    if (row.value && row.value !== '') {
      if (row.value instanceof Array) {
        if (row.value.length === 0) {
          return ''
        }
        let selectUserString = '['
        for (let i = 0; i < row.value.length; i++) {
          const d = row.value[i]
          selectUserString = selectUserString.concat(`${d.name}(${d.code})`)
          if (i !== row.value.length - 1) {
            selectUserString = selectUserString.concat(',')
          }
        }
        selectUserString = selectUserString.concat(']')
        return selectUserString
      }
      if (row.value instanceof Object) {
        return `${row.value.name}(${row.value.code})`
      }
      return row.value
    }
  }

  const moveUp = (index) => {
    rules.value.splice(index, 1, ...rules.value.splice(index - 1, 1, rules.value[index]))
  }

  const moveDown = (index) => {
    rules.value.splice(index, 1, ...rules.value.splice(index + 1, 1, rules.value[index]))
  }

  const deleteRule = (index) => {
    rules.value.splice(index, 1)
  }

  /**
   * 当前操作的行数
   */
  let currentIndex = -1

  const selectUserClick = (row, index) => {
    currentIndex = index
    currentSelectRowData.value = rules.value[index].value
    switch (row.type) {
      case 'USER':
        showUserSelectorModal.value = true
        break
      case 'ORGANIZATION':
        showOrganizationSelector.value = true
        break
      case 'DEPARTMENT':
        showDepartmentSelector.value = true
        break
      case 'ROLE':
        showRoleSelector.value = true
        break
      case 'GROUP':
        showUserGroupSelector.value = true
        break
    }
  }

  const onUserSelectorPositiveClick = () => {
    if (currentIndex > -1) {
      rules.value[currentIndex].value = toRaw(userSelectorRef.value.selected)
      return true
    }
    return true
  }

  const onOrganizationSelectorPositiveClick = () => {
    if (currentIndex > -1) {
      rules.value[currentIndex].value = toRaw(organizationSelectorRef.value.selected)
      return true
    }
    return true
  }

  const onDepartmentSelectorPositiveClick = () => {
    if (currentIndex > -1) {
      rules.value[currentIndex].value = toRaw(departmentSelectorRef.value.selected)
    }
    return true
  }

  const onRoleSelectorPositiveClick = () => {
    if (currentIndex > -1) {
      rules.value[currentIndex].value = toRaw(roleSelectorRef.value.selected)
    }
    return true
  }

  const onUserGroupSelectorPositiveClick = () => {
    if (currentIndex > -1) {
      rules.value[currentIndex].value = toRaw(userGroupSelectorRef.value.selected)
    }
    return true
  }

  defineExpose({
    rules
  })
</script>

<template>
  <div>
    <n-button type="info" :style="{ marginBottom: '10px' }" @click="addRule"> 新增</n-button>
    <n-data-table
      flex-height
      :style="{ height: '435px' }"
      :bordered="true"
      resizable
      :single-line="false"
      :columns="columns"
      :data="rules"
    />
    <n-modal
      v-model:show="showUserSelectorModal"
      :style="{ width: '82%', height: '85%' }"
      :mask-closable="false"
      preset="dialog"
      title="人员配置"
      :show-icon="false"
      positive-text="确认"
      @positive-click="onUserSelectorPositiveClick"
    >
      <user-selector
        ref="userSelectorRef"
        :selected="rules[currentIndex]?.value || []"
        multiple
      ></user-selector>
    </n-modal>

    <n-modal
      v-model:show="showOrganizationSelector"
      :style="{ width: '82%', height: '85%' }"
      :mask-closable="false"
      preset="dialog"
      title="选择机构"
      :show-icon="false"
      positive-text="确认"
      @positive-click="onOrganizationSelectorPositiveClick"
    >
      <organization-selector
        ref="organizationSelectorRef"
        :selected="rules[currentIndex]?.value || []"
      ></organization-selector>
    </n-modal>

    <n-modal
      v-model:show="showDepartmentSelector"
      :style="{ width: '82%', height: '85%' }"
      :mask-closable="false"
      preset="dialog"
      title="选择部门"
      :show-icon="false"
      positive-text="确认"
      @positive-click="onDepartmentSelectorPositiveClick"
    >
      <department-selector
        ref="departmentSelectorRef"
        :selected="rules[currentIndex]?.value || []"
      ></department-selector>
    </n-modal>

    <n-modal
      v-model:show="showRoleSelector"
      :style="{ width: '82%', height: '85%' }"
      :mask-closable="false"
      preset="dialog"
      title="选择角色"
      :show-icon="false"
      positive-text="确认"
      @positive-click="onRoleSelectorPositiveClick"
    >
      <role-selector
        ref="roleSelectorRef"
        :selected="rules[currentIndex]?.value || []"
      ></role-selector>
    </n-modal>
    <n-modal
      v-model:show="showUserGroupSelector"
      :style="{ width: '82%', height: '85%' }"
      :mask-closable="false"
      preset="dialog"
      title="选择用户组"
      :show-icon="false"
      positive-text="确认"
      @positive-click="onUserGroupSelectorPositiveClick"
    >
      <user-group-selector
        ref="userGroupSelectorRef"
        :selected="rules[currentIndex]?.value || []"
      ></user-group-selector>
    </n-modal>
  </div>
</template>
