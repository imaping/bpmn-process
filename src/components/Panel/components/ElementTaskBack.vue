<template>
  <n-collapse-item name="element-task-back">
    <template #header>
      <collapse-title :title="$t('panel.taskBack')">
        <lucide-icon name="Radio" />
      </collapse-title>
    </template>
    <div class="element-extension-task-back">
      <edit-item key="allowBack" label="退回方式">
        <n-select
          v-model:value="backType"
          :options="backTypes"
          @update:value="handleBackTypeChange"
        />
      </edit-item>
      <edit-item key="backNode" label="用户任务" v-if="backType === '1'">
        <n-select
          v-model:value="backNode"
          :options="backNodes"
          @update:value="handleBackNodesChange"
        />
      </edit-item>
    </div>
  </n-collapse-item>
</template>

<script lang="ts" setup>
  import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
  import { getRollBackData, setRollbackButton } from '@/bo-utils/taskUtil'
  import modelerStore from '@/store/modeler'
  import EventEmitter from '@/utils/EventEmitter'
  import { isSequenceFlow, isUserTask } from '@/bo-utils/conditionUtil'

  const modeler = modelerStore()

  onMounted(() => {
    reloadTaskData()
    EventEmitter.on('element-update', reloadTaskData)
  })

  onBeforeUnmount(() => {
    EventEmitter.removeListener('element-update', reloadTaskData)
  })

  const backType = ref('2')
  const backTypes = [
    {
      label: '指定环节',
      value: '1'
    },
    {
      label: '上一环节',
      value: '2'
    },
    {
      label: '任意环节',
      value: '3'
    }
  ]

  const backNode = ref<string>('')
  const backNodes = reactive<{ label: string; value: string }[]>([])

  const handleBackTypeChange = (value) => {
    if (value === '2' || value === '3') {
      setRollbackButton(modeler.getActive, true, value)
    }
  }
  const handleBackNodesChange = (value) => {
    if (backType.value === '1') {
      if (value) {
        setRollbackButton(modeler.getActive, true, '1', value)
      }
    }
  }

  const reloadTaskData = () => {
    backNodes.splice(0, backNodes.length)
    getUserTasks(modeler.getActive, backNodes)
    let rollBackData = getRollBackData(modeler.getActive)
    if (rollBackData) {
      backType.value = rollBackData.backType
      backNode.value = rollBackData.backNode || backNode.value
    }
  }

  const getUserTasks = (element: BpmnElement, userTasks: { label: string; value: string }[]) => {
    let incomings = element.incoming
    if (incomings && incomings.length > 0) {
      for (let index in incomings) {
        let incoming = incomings[index]
        if (isSequenceFlow(incoming)) {
          let userTaskElement = incoming.businessObject?.sourceRef || incoming.sourceRef
          if (isUserTask(userTaskElement)) {
            userTasks.push({
              label: userTaskElement.name || userTaskElement.id,
              value: userTaskElement.id
            })
          }
          getUserTasks(userTaskElement, userTasks)
        }
      }
    }
  }
</script>
