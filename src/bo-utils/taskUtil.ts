import { is, isAny } from 'bpmn-js/lib/util/ModelUtil'
import { Base } from 'diagram-js/lib/model'
import editor from '@/store/editor'
import modeler from '@/store/modeler'
import {
  addExtensionElements,
  getExtensionElementsList,
  removeExtensionElements
} from '@/utils/BpmnExtensionElementsUtil'
import { getListenersContainer } from '@/bo-utils/executionListenersUtil'
import { ModdleElement } from 'moddle'
import { createScript } from '@/bo-utils/scriptUtil'
import modelerStore from '@/store/modeler'
import editorStore from '@/store/editor'

export function getTaskListenerTypes(element: Base) {
  if (is(element, 'bpmn:UserTask')) {
    return [
      { label: '创建', value: 'create' },
      { label: '指派', value: 'assignment' },
      { label: '完成', value: 'complete' },
      { label: '删除', value: 'delete' },
      { label: '更新', value: 'update' },
      { label: '超时', value: 'timeout' }
    ]
  }
  return []
}

export function getDefaultEvent(element: Base) {
  return is(element, 'bpmn:UserTask') ? 'create' : 'create'
}

export function getTaskListeners(element: Base): ModdleElement[] {
  const prefix = editor().getProcessEngine
  const businessObject = getListenersContainer(element)
  return getExtensionElementsList(businessObject, `${prefix}:TaskListener`)
}

export function getTaskListenerType(listener: ModdleElement): string {
  const prefix = editor().getProcessEngine
  if (isAny(listener, [`${prefix}:TaskListener`])) {
    if (listener.get(`${prefix}:class`)) return 'class'
    if (listener.get(`${prefix}:expression`)) return 'expression'
    if (listener.get(`${prefix}:delegateExpression`)) return 'delegateExpression'
    if (listener.get('script')) return 'script'
  }
  return ''
}

export function addTaskListener(element: Base, props: ExecutionListenerForm) {
  const prefix = editor().getProcessEngine
  const moddle = modeler().getModdle
  const businessObject = getListenersContainer(element)
  const listener = moddle!.create(`${prefix}:TaskListener`, {})
  updateListenerProperty(element, listener, props)
  addExtensionElements(element, businessObject, listener)
}

export function updateTaskListener(
  element: Base,
  props: ExecutionListenerForm,
  listener: ModdleElement
) {
  removeExtensionElements(element, getListenersContainer(element), listener)
  addTaskListener(element, props)
}

export function removeTaskListener(element: Base, listener: ModdleElement) {
  removeExtensionElements(element, getListenersContainer(element), listener)
}

function updateListenerProperty(
  element: Base,
  listener: ModdleElement,
  props: ExecutionListenerForm
) {
  const modeling = modeler().getModeling
  const prefix = editor().getProcessEngine
  const {
    event,
    class: listenerClass,
    expression,
    delegateExpression,
    script,
    type,
    fields
  } = props

  const updateProperty = (key, value) =>
    modeling.updateModdleProperties(element, listener, { [`${prefix}:${key}`]: value })

  event && updateProperty('event', event)
  listenerClass && updateProperty('class', listenerClass)
  expression && updateProperty('expression', expression)
  delegateExpression && updateProperty('delegateExpression', delegateExpression)

  if (script) {
    const bpmnScript = createScript(script)
    modeling.updateModdleProperties(element, listener, { script: bpmnScript })
  }
}

export function setTaskButtons(element: Base, value: string | undefined) {
  const store = modelerStore()
  const editor = editorStore()

  const modeling = store.getModeling
  const prefix = editor.getProcessEngine
  modeling.updateProperties(element, {
    [`${prefix}:buttons`]: value
  })
}

export function getTaskButtons(element: Base): string | undefined {
  const editor = editorStore()
  const prefix = editor.getProcessEngine

  return element.businessObject.get(`${prefix}:buttons`)
}

/**
 *
 * @param element
 * @param value 开启或关闭
 * @param type 退回方式
 * @param backNode 退回环节id
 */
export function setRollbackButton(
  element: Base,
  value: boolean,
  type?: string | undefined,
  backNode?: string | undefined
) {
  const store = modelerStore()
  const editor = editorStore()

  const modeling = store.getModeling
  const prefix = editor.getProcessEngine
  const taskButtons = getTaskButtons(element)
  let taskButtonArray: string[] = []
  if (taskButtons) {
    taskButtonArray = taskButtons.split(',')
  }
  const indexOf = taskButtonArray.indexOf('rollback')
  if (!value) {
    if (indexOf > -1) {
      taskButtonArray.splice(indexOf, 1)
    }
    modeling.updateProperties(element, {
      [`${prefix}:backType`]: undefined,
      [`${prefix}:backNode`]: undefined,
      [`${prefix}:buttons`]:
        taskButtonArray && taskButtonArray.length > 0 ? taskButtonArray.join(',') : undefined
    })
  } else {
    if (indexOf == -1) {
      taskButtonArray.push('rollback')
    }
    switch (type) {
      case '1':
        modeling.updateProperties(element, {
          [`${prefix}:backType`]: '1',
          [`${prefix}:backNode`]: backNode,
          [`${prefix}:buttons`]: taskButtonArray.join(',')
        })
        break
      default:
        modeling.updateProperties(element, {
          [`${prefix}:backType`]: type,
          [`${prefix}:backNode`]: undefined,
          [`${prefix}:buttons`]: taskButtonArray.join(',')
        })
    }
  }
}

export function getRollBackData(element: Base) {
  const editor = editorStore()
  const prefix = editor.getProcessEngine
  const taskButtons = getTaskButtons(element)
  if (taskButtons) {
    if (taskButtons.split(',').indexOf('rollback') > -1) {
      const backType = element.businessObject.get(`${prefix}:backType`)
      const backNode = element.businessObject.get(`${prefix}:backNode`)
      return {
        backType,
        backNode
      }
    }
  }
  return undefined
}
