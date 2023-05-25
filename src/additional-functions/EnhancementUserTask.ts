/**
 * 创建用户任务，指定任务名称
 */
import type Modeler from 'bpmn-js/lib/Modeler'
import { Base } from 'diagram-js/lib/model'
import { Event } from 'diagram-js/lib/core/EventBus'
import { isUserTask } from '@/bo-utils/conditionUtil'

type TaskEvent = {
  element: Base
  originalEvent: MouseEvent
} & Event

let userTaskNum = 1

export default function (modeler: Modeler) {
  modeler.on('shape.added', 2000, (event: TaskEvent) => {
    const businessObject = event.element?.businessObject
    if (isUserTask(businessObject)) {
      if (businessObject.name === '') {
        businessObject.name = '用户任务 ' + userTaskNum++
      }
    }
  })
}
