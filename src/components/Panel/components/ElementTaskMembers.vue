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
        <n-form-item label="指定用户:">
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
        <n-form-item label="候选用户:">
          <n-input v-model:value="computeCandidateGroups" type="textarea" placeholder="" disabled />
          <n-button class="edit-button" circle size="small" @click="showUserRulerSelector = true">
            <template #icon>
              <n-icon>
                <edit color="green" />
              </n-icon>
            </template>
          </n-button>
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
      <user-assignee-selector ref="userAssigneeSelectorRef"></user-assignee-selector>
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
  import { computed, onMounted, ref, toRaw } from 'vue'
  import modelerStore from '@/store/modeler'
  import { NButton, NInput } from 'naive-ui'
  import UserRulerSelector from '@/components/Panel/components/SubChild/UserRulerSelector.vue'
  import UserAssigneeSelector from '@/components/Panel/components/SubChild/UserAssigneeSelector.vue'
  import { Edit } from 'lucide-vue-next'
  import {
    getTaskAssignee,
    getTaskCandidateGroup,
    setTaskAssignee,
    setTaskCandidateGroup
  } from '@/bo-utils/taskUtil'
  import { Base } from 'diagram-js/lib/model'
  import { debounce } from 'min-dash'
  import axios from '@/axios'

  const modeler = modelerStore()

  const userRulerSelectorRef = ref<any>(null)

  type User = {
    assigneeType: number
    assignee: string
    candidateGroups: string
    candidateGroupsRules: Array<any> | undefined
  }

  const user = ref<User>({
    assigneeType: 0,
    assignee: '',
    candidateGroups: '',
    candidateGroupsRules: undefined
  })

  const userAssigneeSelectorRef = ref<any>()

  const showUserRulerSelector = ref<boolean>(false)
  const showUserAssigneeSelector = ref<boolean>(false)

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
      }
    }

    const processId = modeler.getActive.businessObject.$parent.id
    const activeId = modeler.getActiveId
    const categoryCode = processId + '_' + activeId
    axios
      .post('/workflow/rest/candidate-rules', {
        categoryCode: categoryCode,
        rules: rulerData
      })
      .then((response) => {
        user.value.candidateGroups = JSON.stringify(rulerData)
        user.value.candidateGroupsRules = toRaw(rulerData)
        setTaskCandidateGroup(modeler.getActive as Base, categoryCode)
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

  const reloadData = () => {
    const taskAssignee = getTaskAssignee(modeler.getActive as Base)
    user.value.assigneeType = taskAssignee.assigneeType
    user.value.assignee = taskAssignee.assignee
    const taskCandidateGroup = getTaskCandidateGroup(modeler.getActive as Base)
    if (taskCandidateGroup) {
      axios.get(`/workflow/rest/candidate-rules/${taskCandidateGroup}`).then((response) => {
        if (
          response.data.status === 1 &&
          response.data.content &&
          response.data.content.rules &&
          response.data.content.rules.length > 0
        ) {
          user.value.candidateGroups = JSON.stringify(response.data.content.rules)
          user.value.candidateGroupsRules = response.data.content.rules
        }
      })
    }
  }

  onMounted(() => {
    reloadData()
  })
</script>
<style scoped>
  .edit-button {
    margin-left: 10px;
  }
</style>
