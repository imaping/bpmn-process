<template>
  <n-collapse-item name="base-info">
    <template #header>
      <collapse-title :title="$t('panel.general')">
        <lucide-icon name="Info" />
      </collapse-title>
    </template>

    <edit-item :label="$t('panel.id')">
      <n-input v-model:value="elementId" maxlength="32" @change="updateElementId" />
    </edit-item>

    <edit-item :label="$t('panel.name')">
      <n-input v-model:value="elementName" maxlength="20" @change="updateElementName" />
    </edit-item>

    <template v-if="isProcess">
      <edit-item key="version" :label="$t('panel.version')">
        <n-input v-model:value="elementVersion" maxlength="20" @change="updateElementVersion" />
      </edit-item>

      <edit-item key="executable" :label="$t('panel.executable')">
        <n-switch v-model:value="elementExecutable" @update:value="updateElementExecutable" />
      </edit-item>
    </template>

    <template v-if="isUserTask">
      <n-grid cols="2" :style="{ marginTop: '15px', marginBottom: '15px' }">
        <n-grid-item
          v-for="button in taskButtons.value"
          :key="button.code"
          :style="{ paddingTop: '10px' }"
        >
          <edit-item :key="button.code" :label="button.name">
            <n-switch v-model:value="button.switchValue" @update:value="handleSwitch(button)" />
          </edit-item>
        </n-grid-item>
      </n-grid>
    </template>
  </n-collapse-item>
</template>

<script lang="ts">
  import { defineComponent, onBeforeUnmount, ref } from 'vue'
  import { mapActions, mapState } from 'pinia'
  import modelerStore from '@/store/modeler'
  import { Base } from 'diagram-js/lib/model'
  import { getNameValue, setNameValue } from '@/bo-utils/nameUtil'
  import { setIdValue } from '@/bo-utils/idUtil'
  import {
    getProcessExecutable,
    getProcessVersionTag,
    setProcessExecutable,
    setProcessVersionTag
  } from '@/bo-utils/processUtil'
  import EventEmitter from '@/utils/EventEmitter'
  import axios from '@/axios'
  import { getTaskButtons, setRollbackButton, setTaskButtons } from '@/bo-utils/taskUtil'
  import userTaskStore from '@/store/userTask'

  export default defineComponent({
    name: 'ElementGenerations',
    data() {
      return {
        elementId: '',
        elementName: '',
        elementVersion: '',
        elementExecutable: true,
        isProcess: false,
        isUserTask: false,
        taskButtons: ref([]),
        elementTaskButtons: []
      }
    },
    computed: {
      ...mapState(modelerStore, ['getActive', 'getActiveId'])
    },
    mounted() {
      this.reloadGenerationData()
      EventEmitter.on('element-update', this.reloadGenerationData)
    },
    unmounted() {
      EventEmitter.removeListener('element-update', this.reloadGenerationData)
    },
    methods: {
      ...mapActions(userTaskStore, { setAllowBack: 'setAllowBack' }),
      reloadGenerationData: function () {
        this.isProcess = !!this.getActive && this.getActive.type === 'bpmn:Process'
        this.isUserTask = !!this.getActive && this.getActive.type === 'bpmn:UserTask'
        this.elementId = this.getActiveId as string
        this.elementName = getNameValue(this.getActive as Base) || ''
        if (this.isProcess) {
          this.elementExecutable = getProcessExecutable(this.getActive as Base)
          this.elementVersion = getProcessVersionTag(this.getActive as Base) || ''
        }
        if (this.isUserTask) {
          const buttons = getTaskButtons(this.getActive as Base)
          if (buttons) {
            this.elementTaskButtons = buttons.split(',')
          } else {
            this.elementTaskButtons = []
          }
          this.getButtonsMeteData()
          this.setAllowBack(this.elementTaskButtons.indexOf('rollback') > -1)
        }
      },
      updateElementName(value: string) {
        setNameValue(this.getActive as Base, value)
      },
      updateElementId(value: string) {
        setIdValue(this.getActive as Base, value)
      },
      updateElementVersion(value: string) {
        const reg = /((\d|([1-9](\d*))).){2}(\d|([1-9](\d*)))/
        if (reg.test(value)) {
          setProcessVersionTag(this.getActive as Base, value)
        } else {
          window.__messageBox.error('版本号必须符合语义化版本2.0.0 要点')
        }
      },
      updateElementExecutable(value: boolean) {
        setProcessExecutable(this.getActive as Base, value)
      },
      handleSwitch(button) {
        if (button.value === 'rollback') {
          this.setAllowBack(button.switchValue)
          if (!button.switchValue) {
            setRollbackButton(this.getActive as Base, false)
          } else {
            setRollbackButton(this.getActive as Base, true, '2')
          }
          return
        }
        const index = this.elementTaskButtons.indexOf(button.value)
        if (button.switchValue && index == -1) {
          this.elementTaskButtons.push(button.value)
        }
        if (!button.switchValue && index > -1) {
          this.elementTaskButtons.splice(index, 1)
        }
        if (this.elementTaskButtons.length == 0) {
          setTaskButtons(this.getActive as Base, undefined)
        } else {
          setTaskButtons(this.getActive as Base, this.elementTaskButtons.join(','))
        }
      },
      getButtonsMeteData() {
        axios.get('/management/rest/base-data-category/HJAN/base-datas').then((response) => {
          this.taskButtons.value = []
          if (response.data.status === 1) {
            for (let index in response.data.content) {
              let buttonMete = response.data.content[index]
              const picked = (({ name, description, code, value }) => ({
                name,
                description,
                code,
                value,
                switchValue: false
              }))(buttonMete)
              picked.switchValue = this.elementTaskButtons.indexOf(picked.value) > -1
              this.taskButtons.value.push(picked)
            }
          }
        })
      }
    }
  })
</script>

<style scoped>
  .light-green {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 128, 0, 0.12);
  }

  .green {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 128, 0, 0.24);
  }
</style>
