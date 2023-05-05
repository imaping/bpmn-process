/**
 * 创建开始事件指定 initiator
 */
import type Modeler from 'bpmn-js/lib/Modeler'
import { Base } from 'diagram-js/lib/model'
import { Event } from 'diagram-js/lib/core/EventBus'
import { isExtendStartEvent } from '@/bo-utils/conditionUtil'
import editorStore from '@/store/editor'

type TaskEvent = {
  element: Base
  originalEvent: MouseEvent
} & Event

export default function (modeler: Modeler) {
  modeler.on('shape.added', 2000, (event: TaskEvent) => {
    const businessObject = event.element?.businessObject
    if (isExtendStartEvent(businessObject)) {
      const editor = editorStore()
      const prefix = editor.getProcessEngine
      businessObject.set(`${prefix}:initiator`, 'INITIATOR')
    }
  })
}
