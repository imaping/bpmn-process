import { is, isAny } from 'bpmn-js/lib/util/ModelUtil'
import { Base } from 'diagram-js/lib/model'
import editor from '@/store/editor'
import editorStore from '@/store/editor'
import modeler from '@/store/modeler'
import modelerStore from '@/store/modeler'
import {
  addExtensionElements,
  getExtensionElementsList,
  removeExtensionElements
} from '@/utils/BpmnExtensionElementsUtil'
import { getListenersContainer } from '@/bo-utils/executionListenersUtil'
import { ModdleElement } from 'moddle'
import { createScript } from '@/bo-utils/scriptUtil'
import { Countersign } from '@/types/Countersign'

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

export function getTaskForms(element: Base): string | undefined {
  const editor = editorStore()
  const prefix = editor.getProcessEngine

  return element.businessObject.get(`${prefix}:formKey`)
}

export function setTaskForms(element: Base, value: string) {
  const store = modelerStore()
  const editor = editorStore()

  const modeling = store.getModeling
  const prefix = editor.getProcessEngine
  if (value && value !== '') {
    modeling.updateProperties(element, {
      [`${prefix}:formKey`]: value
    })
  } else {
    modeling.updateProperties(element, {
      [`${prefix}:formKey`]: undefined
    })
  }
}

export function getTaskAttachment(element: Base): string | undefined {
  const editor = editorStore()
  const prefix = editor.getProcessEngine

  return element.businessObject.get(`${prefix}:attachment`)
}

export function setTaskAttachment(element: Base, value: string) {
  const store = modelerStore()
  const editor = editorStore()

  const modeling = store.getModeling
  const prefix = editor.getProcessEngine
  if (value && value !== '') {
    modeling.updateProperties(element, {
      [`${prefix}:attachment`]: value
    })
  } else {
    modeling.updateProperties(element, {
      [`${prefix}:attachment`]: undefined
    })
  }
}

export function getTaskFunction(element: Base): string | undefined {
  const editor = editorStore()
  const prefix = editor.getProcessEngine

  return element.businessObject.get(`${prefix}:functionGroup`)
}

export function setTaskFunction(element: Base, value: string | undefined) {
  const store = modelerStore()
  const editor = editorStore()

  const modeling = store.getModeling
  const prefix = editor.getProcessEngine
  if (value && value !== '') {
    modeling.updateProperties(element, {
      [`${prefix}:functionGroup`]: value
    })
  } else {
    modeling.updateProperties(element, {
      [`${prefix}:functionGroup`]: undefined
    })
  }
}

export function getTaskAssignee(element: Base) {
  const store = modelerStore()
  const editor = editorStore()

  const modeling = store.getModeling
  const prefix = editor.getProcessEngine
  return {
    assigneeType: element.businessObject.get(`${prefix}:assigneeType`),
    assignee: element.businessObject.get(`${prefix}:assignee`)
  }
}

export function setTaskAssignee(element: Base, type: number, assignee: string) {
  const store = modelerStore()
  const editor = editorStore()

  const modeling = store.getModeling
  const prefix = editor.getProcessEngine
  if ([1, 2, 3, 4].includes(type)) {
    modeling.updateProperties(element, {
      [`${prefix}:assigneeType`]: type,
      [`${prefix}:assignee`]: assignee
    })
  } else {
    modeling.updateProperties(element, {
      [`${prefix}:assigneeType`]: undefined,
      [`${prefix}:assignee`]: undefined
    })
  }
}

export function setTaskCandidateGroup(element: Base, value: string) {
  const store = modelerStore()
  const editor = editorStore()

  const modeling = store.getModeling
  const prefix = editor.getProcessEngine
  if (value) {
    modeling.updateProperties(element, {
      [`${prefix}:candidateGroups`]: value
    })
  } else {
    modeling.updateProperties(element, {
      [`${prefix}:candidateGroups`]: undefined
    })
  }
}

export function getTaskCandidateGroup(element: Base) {
  const store = modelerStore()
  const editor = editorStore()

  const modeling = store.getModeling
  const prefix = editor.getProcessEngine
  return element.businessObject.get(`${prefix}:candidateGroups`)
}

export function setTaskCountersign(element: Base, value: Countersign) {
  const store = modelerStore()
  const editor = editorStore()
  const moddle = modeler().getModdle!
  const modeling = store.getModeling
  const prefix = editor.getProcessEngine
  if (value.enable) {
    modeling.updateProperties(element, {
      loopCharacteristics: moddle.create('bpmn:MultiInstanceLoopCharacteristics', {
        isSequential: value.runningType == 2,
        collection: value.collection,
        elementVariable: '_PSH_COUNTERSIGN_ASSIGNEE',
        [`${prefix}:radio`]: value.ratio,
        [`${prefix}:all`]: value.all,
        [`${prefix}:type`]: value.type,
        [`${prefix}:pass`]: value.pass,
        [`${prefix}:noPass`]: value.noPass
      }),
      [`${prefix}:assignee`]: '${_PSH_COUNTERSIGN_ASSIGNEE}',
      [`${prefix}:assigneeType`]: undefined
    })
  } else {
    modeling.updateProperties(element, {
      loopCharacteristics: undefined,
      [`${prefix}:assignee`]: undefined
    })
  }
}

export function getTaskCountersign(element: Base): Countersign {
  const editor = editorStore()
  const prefix = editor.getProcessEngine
  const loopCharacteristics = element.businessObject.loopCharacteristics
  if (loopCharacteristics) {
    return {
      collection: loopCharacteristics.collection || '',
      enable: true,
      type: loopCharacteristics.get(`${prefix}:type`) || 1,
      ratio: loopCharacteristics.get(`${prefix}:ratio`) || 50,
      all: loopCharacteristics.get(`${prefix}:all`) || false,
      runningType: loopCharacteristics.isSequential ? 2 : 1,
      pass: loopCharacteristics.get(`${prefix}:pass`) || 1,
      noPass: loopCharacteristics.get(`${prefix}:noPass`) || 1
    }
  } else {
    return {
      collection: '',
      enable: false,
      type: 1,
      ratio: 50,
      all: false,
      runningType: 1,
      pass: 1,
      noPass: 1
    }
  }
}
