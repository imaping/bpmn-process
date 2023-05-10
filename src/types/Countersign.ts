/**
 * 会签
 */
export type Countersign = {
  enable: boolean
  type: number
  ratio: number
  all: boolean
  runningType: 1 | 2
  pass: 1 | 2
  noPass: 1 | 2
  collection: string
  votePowerType: 0 | 1 | 2
  votePowerAssignee: string
}
