<template>
  <n-collapse-item name="element-members-back">
    <template #header>
      <collapse-title :title="$t('panel.taskMember')">
        <lucide-icon name="User" />
      </collapse-title>
    </template>
    <div class="element-extension-task-back">
      <n-form
        label-placement="left"
        label-align="right"
        label-width="auto"
        style="width: 90%; margin-left: 20px"
      >
        <n-form-item label="启动会签:">
          <n-switch
            v-model:value="user.countersign.enable"
            @update:value="handleCountersignChange"
          />
        </n-form-item>
        <n-form-item v-show="!user.countersign.enable" label="指定用户:">
          <n-input v-model:value="user.assignee" placeholder="" disabled />
          <n-button
            class="edit-button"
            circle
            size="small"
            @click="showUserAssigneeSelector = true"
          >
            <template #icon>
              <n-icon>
                <edit color="green" />
              </n-icon>
            </template>
          </n-button>
        </n-form-item>
        <n-form-item :label="user.countersign.enable ? '会签用户:' : '候选用户:'">
          <n-input v-model:value="computeCandidateGroups" type="textarea" placeholder="" disabled />
          <n-button class="edit-button" circle size="small" @click="showUserRulerSelector = true">
            <template #icon>
              <n-icon>
                <edit color="green" />
              </n-icon>
            </template>
          </n-button>
        </n-form-item>
        <n-form-item v-show="user.countersign.enable" label="全部处理:">
          <n-switch v-model:value="user.countersign.all" @update:value="handleCountersignChange" />
        </n-form-item>
        <n-form-item v-show="user.countersign.enable" label="执行方式:">
          <n-select
            v-model:value="user.countersign.runningType"
            :options="[
              {
                label: '并行',
                value: 1
              },
              {
                label: '串行',
                value: 2
              }
            ]"
            @update:value="handleCountersignChange"
          />
        </n-form-item>
        <n-form-item v-show="user.countersign.enable" label="类型:">
          <n-select
            v-model:value="user.countersign.type"
            :options="counterSignTypeOptions"
            @update:value="handleCountersignChange"
          />
        </n-form-item>
        <n-form-item v-show="user.countersign.enable && user.countersign.type == 1" label="比例:">
          <n-select
            v-model:value="user.countersign.ratio"
            :options="
              Array.from({ length: 10 }).map((item, index) => {
                const value = (index + 1) * 10
                return {
                  label: value + '%',
                  value: value
                }
              })
            "
            @update:value="handleCountersignChange"
          />
        </n-form-item>
        <n-form-item v-show="user.countersign.enable" label="通过:">
          <n-select
            v-model:value="user.countersign.pass"
            :options="[
              {
                label: '流转后置节点',
                value: 1
              }
            ]"
            @update:value="handleCountersignChange"
          />
        </n-form-item>
        <n-form-item v-show="user.countersign.enable" label="不通过:">
          <n-select
            v-model:value="user.countersign.noPass"
            :options="[
              {
                label: '流转后置节点',
                value: 1
              },
              {
                label: '回退前置节点',
                value: 2
              }
            ]"
            @update:value="handleCountersignChange"
          />
        </n-form-item>
      </n-form>
    </div>
    <n-modal
      v-model:show="showUserAssigneeSelector"
      :style="{ width: '50%', height: '25%' }"
      :mask-closable="false"
      preset="dialog"
      title="人员配置"
      positive-text="确认"
      @positive-click="onAssigneeSelectorPositiveClick"
    >
      <user-assignee-selector
        ref="userAssigneeSelectorRef"
        :assignee="{ type: user.assigneeType, value: user.assignee }"
      ></user-assignee-selector>
    </n-modal>
    <n-modal
      v-model:show="showUserRulerSelector"
      :style="{ width: '75%', height: '620px' }"
      :mask-closable="false"
      preset="dialog"
      title="候选用户配置"
      :show-icon="false"
      positive-text="确认"
      @positive-click="onUserRulerSelectorPositiveClick"
    >
      <user-ruler-selector
        ref="userRulerSelectorRef"
        :rules="user.candidateGroupsRules"
        :style="{ paddingTop: '10px' }"
      ></user-ruler-selector>
    </n-modal>
  </n-collapse-item>
</template>

<script lang="ts" setup>
  import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue'
  import modelerStore from '@/store/modeler'
  import { NButton, NInput } from 'naive-ui'
  import UserRulerSelector from '@/components/Panel/components/SubChild/UserRulerSelector.vue'
  import UserAssigneeSelector from '@/components/Panel/components/SubChild/UserAssigneeSelector.vue'
  import { Edit } from 'lucide-vue-next'
  import {
    getTaskAssignee,
    getTaskCandidateGroup,
    getTaskCountersign,
    setTaskAssignee,
    setTaskCandidateGroup,
    setTaskCountersign
  } from '@/bo-utils/taskUtil'
  import { Base } from 'diagram-js/lib/model'
  import { debounce } from 'min-dash'
  import axios from '@/axios'
  import EventEmitter from '@/utils/EventEmitter'
  import { Countersign } from '@/types/Countersign'

  const modeler = modelerStore()

  const userRulerSelectorRef = ref<any>(null)

  type User = {
    assigneeType: number
    assignee: string
    candidateGroups: string
    candidateGroupsRules: Array<any> | undefined
    countersign: Countersign
  }

  const user = ref<User>({
    assigneeType: 0,
    assignee: '',
    candidateGroups: '',
    candidateGroupsRules: undefined,
    countersign: {
      collection: '',
      enable: false,
      type: 1,
      ratio: 50,
      all: false,
      runningType: 1,
      pass: 1,
      noPass: 1
    }
  })

  const counterSignTypeOptions = [
    {
      label: '比例通过',
      value: 1
    },
    {
      label: '任意一票通过',
      value: 2
    },
    {
      label: '任意一票否决',
      value: 3
    }
  ]

  const userAssigneeSelectorRef = ref<any>()

  const showUserRulerSelector = ref<boolean>(false)
  const showUserAssigneeSelector = ref<boolean>(false)

  const candidateGroupsComputed = computed<string>(() => {
    if (user.value.candidateGroups && user.value.candidateGroups !== '') {
      return user.value.candidateGroups
    }
    if (user.value.countersign.enable) {
      return user.value.countersign.collection
    }
    return modeler.getActive.businessObject.$parent.id + '_' + modeler.getActiveId
  })

  const onUserRulerSelectorPositiveClick = () => {
    const rulerData = toRaw(userRulerSelectorRef.value.rules)
    for (let index: number in rulerData) {
      if (
        rulerData[index].value === null ||
        rulerData[index].value === '' ||
        rulerData[index].value.length == 0
      ) {
        window.__messageBox.warning(`第${++index}行数据不能为空`)
        return false
      } else {
        rulerData[index].sort = index
      }
    }
    axios
      .post('/workflow/rest/candidate-rules', {
        categoryCode: candidateGroupsComputed.value,
        rules: rulerData
      })
      .then(() => {
        user.value.candidateGroupsRules = toRaw(rulerData)
        if (user.value.countersign.enable) {
          user.value.countersign.collection = candidateGroupsComputed.value
          handleCountersignChange()
        } else {
          user.value.candidateGroups = candidateGroupsComputed.value
          setTaskCandidateGroup(modeler.getActive as Base, candidateGroupsComputed.value)
        }
        showUserRulerSelector.value = false
      })
      .catch((error) => {
        window.__messageBox.error(error.message)
        return false
      })
  }

  const computeCandidateGroups = computed(() => {
    let value = ''
    for (let index in user.value.candidateGroupsRules) {
      const rule = user.value.candidateGroupsRules[index]
      if (index > 0) {
        switch (rule.operator) {
          case 'OR':
            value += '(或)'
            break
          case 'AND':
            value += '(与)'
            break
          case 'DIFF':
            value += '(排除)'
            break
        }
      }
      switch (rule.type) {
        case 'USER':
          value += '[用户]'
          break
        case 'GROUP':
          value += '[组]'
          break
        case 'CURRENTLOGINUSER':
          value += '[当前登录用户]'
          break
        case 'INITIATOR':
          value += '[流程发起人]'
          continue
        case 'ROLE':
          value += '[角色]'
          break
        case 'DEPARTMENT':
          value += '[部门]'
          break
        case 'ORGANIZATION':
          value += '[组织机构]'
          break
      }
      if (rule.value && rule.value.length > 0) {
        value += '<' + rule.value.map((d) => d.name).toString() + '>'
      }
    }
    return value
  })

  const onAssigneeSelectorPositiveClick = () => {
    userAssigneeSelectorRef?.value.getUserAssignee((assignee) => {
      user.value.assigneeType = assignee.type
      user.value.assignee = assignee.value
      setTaskAssignee(modeler.getActive as Base, user.value.assigneeType, user.value.assignee)
      showUserAssigneeSelector.value = false
    })
    return false
  }

  const reloadData = debounce(() => {
    user.value.countersign = getTaskCountersign(modeler.getActive as Base)
    let taskCandidateGroup
    if (!user.value.countersign.enable) {
      const taskAssignee = getTaskAssignee(modeler.getActive as Base)
      user.value.assigneeType = taskAssignee.assigneeType || ''
      user.value.assignee = taskAssignee.assignee || ''
      taskCandidateGroup = getTaskCandidateGroup(modeler.getActive as Base)
      user.value.candidateGroups = taskCandidateGroup
    } else {
      taskCandidateGroup = user.value.countersign.collection
    }
    if (!taskCandidateGroup) {
      taskCandidateGroup = candidateGroupsComputed.value
    }
    axios.get(`/workflow/rest/candidate-rules/${taskCandidateGroup}`).then((response) => {
      if (
        response.data.status === 1 &&
        response.data.content &&
        response.data.content.rules &&
        response.data.content.rules.length > 0
      ) {
        user.value.candidateGroupsRules = response.data.content.rules
      }
    })
  }, 200)

  const handleCountersignChange = () => {
    if (user.value.countersign.enable) {
      user.value.countersign.collection = candidateGroupsComputed.value
      user.value.candidateGroups = ''
    } else {
      user.value.candidateGroups = user.value.countersign.collection
    }
    setTaskCountersign(modeler.getActive as Base, user.value.countersign)
    if (!user.value.countersign.enable) {
      user.value.assigneeType = 0
      user.value.assignee = ''
    }
  }

  onMounted(() => {
    reloadData()
    EventEmitter.on('element-update', reloadData)
  })

  onBeforeUnmount(() => {
    EventEmitter.removeListener('element-update', reloadData)
  })
</script>
<style scoped>
  .edit-button {
    margin-left: 10px;
  }
</style>
