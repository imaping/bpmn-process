/**
 * 创建用户任务，指定任务名称
 */
import type Modeler from 'bpmn-js/lib/Modeler'
import { Base } from 'diagram-js/lib/model'
import { Event } from 'diagram-js/lib/core/EventBus'
import { isUserTask } from '@/bo-utils/conditionUtil'
import editorStore from '@/store/editor'

type TaskEvent = {
  element: Base
  originalEvent: MouseEvent
} & Event

let userTaskNum = 1

export default function (modeler: Modeler) {
  modeler.on('shape.added', 2000, (event: TaskEvent) => {
    const businessObject = event.element?.businessObject
    if (isUserTask(businessObject)) {
      const editor = editorStore()
      const prefix = editor.getProcessEngine
      if (!businessObject.get(`${prefix}:buttons`)) {
        businessObject.set(`${prefix}:backType`, '3')
        businessObject.set(`${prefix}:buttons`, 'rollback')
      }
      if (businessObject.name === undefined || businessObject.name === '') {
        businessObject.name = '用户任务 ' + userTaskNum++
      }
    }
  })
}
