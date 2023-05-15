import { Component, defineComponent, markRaw, onMounted, reactive, ref } from 'vue'
import { NCollapse } from 'naive-ui'
import { Base, Connection, Label, Shape } from 'diagram-js/lib/model'
import { Translate } from 'diagram-js/lib/i18n/translate'
import debounce from 'lodash.debounce'

import EventEmitter from '@/utils/EventEmitter'
import modelerStore from '@/store/modeler'
import userTaskStore from '@/store/userTask'
import Logger from '@/utils/Logger'

import getBpmnIconType from '@/bpmn-icons/getIconType'
import bpmnIcons from '@/bpmn-icons'
import BpmnIcon from '@/components/common/BpmnIcon.vue'
import { isExecutable } from '@/bo-utils/executionListenersUtil'
import { isStartInitializable } from '@/bo-utils/initiatorUtil'

import ElementGenerations from './components/ElementGenerations.vue'
import ElementConditional from './components/ElementConditional.vue'
import ElementTaskEvents from './components/ElementTaskEvents.vue'
import ElementTaskBack from './components/ElementTaskBack.vue'
import ElementTaskCopy from './components/ElementTaskCopy.vue'
import ElementTaskMembers from './components/ElementTaskMembers.vue'
import ElementTaskForm from './components/ElementTaskForm.vue'
import ElementTaskAttachment from './components/ElementTaskAttachment.vue'
import ElementTaskFunction from './components/ElementTaskFunction.vue'
import ElementExtensionProperties from './components/ElementExtensionProperties.vue'
import ElementStartInitiator from './components/ElementStartInitiator.vue'
import { isCanbeConditional, isUserTask } from '@/bo-utils/conditionUtil'
import { customTranslate } from '@/additional-modules/Translate'

const Panel = defineComponent({
  name: 'PropertiesPanel',
  setup() {
    const taskStore = userTaskStore()
    const modeler = modelerStore()
    const panel = ref<HTMLDivElement | null>(null)
    const currentElementId = ref<string | undefined>(undefined)
    const currentElementType = ref<string | undefined>(undefined)

    const penalTitle = ref<string | undefined>('属性配置')
    const bpmnIconName = ref<string>('Process')
    const bpmnElementName = ref<string>('Process')

    const renderComponents = reactive<Component[]>([])

    const defaultExpandedNames = ref<string[]>([])

    taskStore.$subscribe((mutation, state) => {
      const active = modeler.getActive
      if (active) {
        setCurrentComponents(active)
      }
    })

    const setCurrentComponents = (element: BpmnElement) => {
      // 清空
      renderComponents.splice(0, renderComponents.length)
      renderComponents.push(ElementGenerations)
      isUserTask(element) && taskStore.isAllowBack && renderComponents.push(ElementTaskBack)
      isUserTask(element) && taskStore.isAllowCopy && renderComponents.push(ElementTaskCopy)
      isUserTask(element) && renderComponents.push(ElementTaskForm)
      isUserTask(element) && renderComponents.push(ElementTaskAttachment)
      isCanbeConditional(element) && renderComponents.push(ElementConditional)
      // isExecutable(element) && renderComponents.push(ElementExecutionListeners)
      isUserTask(element) && renderComponents.push(ElementTaskMembers)
      // isUserTask(element) && renderComponents.push(ElementTaskListeners)
      isExecutable(element) && renderComponents.push(ElementTaskEvents)
      isUserTask(element) && renderComponents.push(ElementTaskFunction)
      isStartInitializable(element) && renderComponents.push(ElementStartInitiator)
      renderComponents.push(ElementExtensionProperties)
    }

    // 设置选中元素，更新 store
    const setCurrentElement = debounce((element: Shape | Base | Connection | Label | null) => {
      let activatedElement: BpmnElement | undefined = element
      let activatedElementTypeName = ''

      if (!activatedElement) {
        activatedElement =
          modeler.getElRegistry?.find((el) => el.type === 'bpmn:Process') ||
          modeler.getElRegistry?.find((el) => el.type === 'bpmn:Collaboration')

        if (!activatedElement) {
          return Logger.prettyError('No Element found!')
        }
      }
      activatedElementTypeName = getBpmnIconType(activatedElement)

      modeler.setElement(markRaw(activatedElement))
      currentElementId.value = activatedElement.id
      currentElementType.value = activatedElement.type.split(':')[1]

      penalTitle.value = modeler.getModeler?.get<Translate>('translate')(currentElementType.value)
      bpmnIconName.value = bpmnIcons[activatedElementTypeName]
      bpmnElementName.value = activatedElementTypeName

      setCurrentComponents(activatedElement)
      EventEmitter.emit('element-update', activatedElement)

      Logger.prettyPrimary(
        'Selected element changed',
        `ID: ${activatedElement.id} , type: ${activatedElement.type}`
      )
    }, 100)

    EventEmitter.on('modeler-init', (modeler) => {
      // 导入完成后默认选中 process 节点
      modeler.on('import.done', () => {
        setCurrentElement(null)
      })
      // 监听选择事件，修改当前激活的元素以及表单
      modeler.on('selection.changed', ({ newSelection }) => {
        setCurrentElement(newSelection[0] || null)
      })
      modeler.on('element.changed', ({ element }) => {
        // 保证 修改 "默认流转路径" 等类似需要修改多个元素的事件发生的时候，更新表单的元素与原选中元素不一致。
        if (element && element.id === currentElementId.value) {
          setCurrentElement(element)
        }
      })

      modeler.on('element.click', (event) => {
        Logger.prettyInfo('Element Click', event)
      })
    })

    onMounted(() => !currentElementId.value && setCurrentElement())

    return () => (
      <div ref={panel} class="panel">
        <div class="panel-header">
          <BpmnIcon name={bpmnIconName.value}></BpmnIcon>
          <p>{bpmnElementName.value}</p>
          <p>{customTranslate(currentElementType.value || 'Process')}</p>
        </div>
        <NCollapse arrow-placement="right" defaultExpandedNames={defaultExpandedNames.value}>
          {renderComponents.map((component) => (
            <component is={component}></component>
          ))}
        </NCollapse>
      </div>
    )
  }
})

export default Panel;
