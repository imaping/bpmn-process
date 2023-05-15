<template>
  <n-collapse-item name="element-task-copy">
    <template #header>
      <collapse-title :title="$t('panel.taskCopy')">
        <lucide-icon name="Copy" />
      </collapse-title>
    </template>
    <div class="element-extension-task-back">
      <n-form
        label-placement="left"
        label-align="right"
        label-width="auto"
        style="width: 90%; margin-left: 20px"
      >
        <n-form-item label="抄送方式:">
          <n-select
            v-model:value="copyUser.type"
            :options="copyTypes"
            @update:value="handleBackTypeChange"
          />
        </n-form-item>
        <n-form-item v-show="copyUser.type === '1'" label="表达式:">
          <n-input
            v-model:value="copyUser.expression"
            type="text"
            placeholder="请输入表达式"
            @change="updateExpression"
          />
        </n-form-item>
        <n-form-item v-show="copyUser.type === '2'" label="指定用户:">
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
  </n-collapse-item>
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
      :rules="copyUser.candidateGroupsRules"
      :style="{ paddingTop: '10px' }"
    ></user-ruler-selector>
  </n-modal>
</template>

<script lang="ts" setup>
  import { NButton, NInput } from 'naive-ui'
  import { Edit } from 'lucide-vue-next'
  import { computed, onBeforeUnmount, onMounted, ref, toRaw } from 'vue'
  import { getCopyData, setCopyButton } from '@/bo-utils/taskUtil'
  import modelerStore from '@/store/modeler'
  import EventEmitter from '@/utils/EventEmitter'
  import UserRulerSelector from '@/components/Panel/components/SubChild/UserRulerSelector.vue'
  import axios from '@/axios'

  const modeler = modelerStore()

  onMounted(() => {
    reloadTaskData()
    EventEmitter.on('element-update', reloadTaskData)
  })

  onBeforeUnmount(() => {
    EventEmitter.removeListener('element-update', reloadTaskData)
  })

  const userRulerSelectorRef = ref<any>(null)

  type CopyUser = {
    type: string
    expression: string
    candidateGroups: string
    candidateGroupsRules: Array<any> | undefined
  }

  const copyUser = ref<CopyUser>({
    type: '3',
    expression: '',
    candidateGroups: '',
    candidateGroupsRules: undefined
  })

  const showUserRulerSelector = ref<boolean>(false)

  const copyTypes = [
    {
      label: '表达式',
      value: '1'
    },
    {
      label: '指定用户',
      value: '2'
    },
    {
      label: '任意用户',
      value: '3'
    }
  ]

  const computeCandidateGroups = computed(() => {
    let value = ''
    for (let index in copyUser.value.candidateGroupsRules) {
      const rule = copyUser.value.candidateGroupsRules[index]
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

  const candidateGroupsComputed = computed<string>(() => {
    if (copyUser.value.candidateGroups && copyUser.value.candidateGroups !== '') {
      return copyUser.value.candidateGroups
    }
    return modeler.getActive.businessObject.$parent.id + '_' + modeler.getActiveId + '_copy'
  })

  const onUserRulerSelectorPositiveClick = async () => {
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
    try {
      await axios.post('/workflow/rest/candidate-rules', {
        categoryCode: candidateGroupsComputed.value,
        rules: rulerData
      })
      copyUser.value.candidateGroupsRules = toRaw(rulerData)
      copyUser.value.candidateGroups = candidateGroupsComputed.value
      showUserRulerSelector.value = false
      setCopyButton(modeler.getActive, true, '2', copyUser.value.candidateGroups)
    } catch (e) {
      window.__messageBox.error(e.message)
      return false
    }
  }

  const handleBackTypeChange = (value) => {
    setCopyButton(modeler.getActive, true, value, undefined)
  }

  const updateExpression = (value: string) => {
    setCopyButton(modeler.getActive, true, '1', value)
  }

  const reloadTaskData = () => {
    let copyData = getCopyData(modeler.getActive)
    if (copyData) {
      copyUser.value.type = copyData.copyType
      if (copyUser.value.type === '2') {
        copyUser.value.candidateGroups = copyData.copyValue || ''
        if (copyUser.value.candidateGroups && copyUser.value.candidateGroups !== '') {
          axios
            .get(`/workflow/rest/candidate-rules/${copyUser.value.candidateGroups}`)
            .then((response) => {
              if (
                response.data.status === 1 &&
                response.data.content &&
                response.data.content.rules &&
                response.data.content.rules.length > 0
              ) {
                copyUser.value.candidateGroupsRules = response.data.content.rules
              }
            })
        }
      } else if (copyUser.value.type === '1') {
        copyUser.value.expression = copyData.copyValue || ''
      }
    }
  }
</script>

<style scoped>
  .edit-button {
    margin-left: 10px;
  }
</style>
