<script lang="ts" setup>
  import { useI18n } from 'vue-i18n'
  import { reactive, ref, toRaw } from 'vue'
  import { FormInst, FormItemRule, FormRules, useMessage } from 'naive-ui'
  import JsonEditorVue from 'json-editor-vue3'

  const { t } = useI18n()

  type TaskFunction = {
    id: string
    name: string
    code: string
    value: Object
  }

  const props = withDefaults(
    defineProps<{
      function: TaskFunction | undefined
    }>(),
    {
      function: (): TaskFunction => {
        return {
          id: '',
          code: '',
          name: '',
          value: {}
        }
      }
    }
  )

  const model = reactive<TaskFunction>(JSON.parse(JSON.stringify(toRaw(props.function))))
  if (model.value && typeof model.value === 'string') {
    model.value = JSON.parse(model.value)
  }

  const rules: FormRules = {
    code: [
      {
        required: true,
        validator(rule: FormItemRule, value: string) {
          if (!value) {
            return new Error('代码不能为空')
          }
          return true
        },
        trigger: ['input', 'blur']
      }
    ],
    name: [
      {
        required: true,
        validator(rule: FormItemRule, value: string) {
          if (!value) {
            return new Error('属性名不能为空')
          }
          return true
        },
        trigger: ['input', 'blur']
      }
    ],
    value: [
      {
        required: true,
        validator(rule: FormItemRule, value: string) {
          if (!value) {
            return new Error('属性值不能为空')
          }
          return true
        },
        trigger: ['input', 'blur']
      }
    ]
  }

  const formRef = ref<FormInst | null>(null)

  const getData = (success, error) => {
    return formRef.value?.validate((errors) => {
      if (!errors) {
        success(model)
      } else {
        error(errors)
      }
    })
  }

  defineExpose({
    getData
  })
</script>

<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-placement="left"
    label-width="auto"
    :style="{ height: '380px' }"
  >
    <n-form-item path="code" label="代码">
      <n-input
        v-model:value="model.code"
        placeholder=""
        :disabled="model.id != null && model.id != ''"
        @keydown.enter.prevent
      />
    </n-form-item>
    <n-form-item path="name" label="属性名">
      <n-input v-model:value="model.name" placeholder="" @keydown.enter.prevent />
    </n-form-item>
    <n-form-item path="value" label="属性值">
      <json-editor-vue
        v-model="model.value"
        class="editor"
        :options="{
          enableSort: false,
          enableTransform: false,
          language: 'zh-CN'
        }"
      />
    </n-form-item>
  </n-form>
</template>
<style scoped>
  .editor {
    height: 250px;
    width: 100%;
  }

  :deep(.jsoneditor-poweredBy) {
    display: none !important;
  }

  :deep(.full-screen show) {
    position: absolute;
    right: 0;
    top: 0;
    padding: 10px;
  }
</style>
