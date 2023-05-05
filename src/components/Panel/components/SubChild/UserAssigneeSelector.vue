<script lang="ts" setup>
  import { useI18n } from 'vue-i18n'
  import { computed, ref, toRaw } from 'vue'
  import { FormInst, FormItemRule, FormRules, NButton, NSelect } from 'naive-ui'
  import { Edit } from 'lucide-vue-next'
  import UserSelector from '@/components/Panel/components/SubChild/UserSelector.vue'
  import currentUser from '@/store/currentUser'

  const { t } = useI18n()

  const currentUserStore = currentUser()

  type UserAssignee = {
    type: number
    value: string
  }
  const userSelectorRef = ref<any>(null)

  const showUserSelectorModal = ref<boolean>(false)

  const assigneeTypeOptions = [
    {
      label: '指定用户',
      value: 1
    },
    {
      label: '流程发起人',
      value: 2
    },
    {
      label: '当前登录用户',
      value: 4
    },
    {
      label: '表达式',
      value: 3
    }
  ]

  const props = withDefaults(
    defineProps<{
      assignee: UserAssignee | undefined
    }>(),
    {
      assignee: (): UserAssignee => {
        return {
          type: 1,
          value: ''
        }
      }
    }
  )

  const model = ref<UserAssignee>(JSON.parse(JSON.stringify(toRaw(props.assignee))))
  if (model.value.type === '') {
    model.value.type = 1
  }

  const valueLabel = computed(() => {
    if (model.value.type === 3) {
      return '表达式'
    }
    return '处理用户'
  })

  const rules: FormRules = {
    value: [
      {
        required: true,
        validator(rule: FormItemRule, value: string) {
          if (value === '') {
            if (model.value.type === 1) {
              return new Error('指定用户不能为空')
            }
            if (model.value.type === 3) {
              return new Error('表达式不能为空')
            }
          }

          return true
        },
        trigger: ['input', 'blur']
      }
    ]
  }

  const formRef = ref<FormInst | null>(null)

  const onUserSelectorPositiveClick = () => {
    const selected = userSelectorRef.value.selected
    if (selected.length > 0) {
      model.value.value = selected[0]
    }
    showUserSelectorModal.value = false
  }

  const getUserAssignee = (success, error?: Function | undefined) => {
    return formRef.value?.validate((errors) => {
      if (!errors) {
        success(model.value)
      } else {
        error && error(errors)
      }
    })
  }

  const assigneeTypeChange = (value) => {
    model.value.type = value
    if (value === 2) {
      model.value.value = '${INITIATOR}'
    } else if (value === 4) {
      if (currentUserStore.isAuthenticated) {
        model.value.value = currentUserStore.getLoginName
      }
    } else {
      model.value.value = ''
    }
    formRef.value?.restoreValidation()
  }

  defineExpose({
    getUserAssignee
  })
</script>

<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-align="right"
    label-placement="left"
    label-width="auto"
    :style="{ height: '380px' }"
  >
    <n-form-item path="type" label="用户类型">
      <n-select
        v-model:value="model.type"
        :options="assigneeTypeOptions"
        :on-update:value="assigneeTypeChange"
      />
    </n-form-item>
    <n-form-item path="value" :label="valueLabel">
      <n-input
        v-model:value="model.value"
        :disabled="model.type === 1 || model.type === 2 || model.type === 4"
        placeholder=""
      />
      <n-button
        v-if="model.type === 1"
        class="edit-button"
        circle
        size="small"
        @click="showUserSelectorModal = true"
      >
        <template #icon>
          <n-icon>
            <edit color="green" size="16" />
          </n-icon>
        </template>
      </n-button>
    </n-form-item>
  </n-form>
  <n-modal
    v-model:show="showUserSelectorModal"
    :style="{ width: '82%', height: '85%' }"
    :mask-closable="false"
    preset="dialog"
    title="人员配置"
    positive-text="确认"
    @positive-click="onUserSelectorPositiveClick"
  >
    <user-selector
      ref="userSelectorRef"
      :selected="model.value === '' ? [] : [model.value]"
      :multiple="false"
    ></user-selector>
  </n-modal>
</template>
<style scoped>
  .edit-button {
    margin-left: 10px;
  }
</style>
