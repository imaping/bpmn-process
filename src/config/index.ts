import { EditorSettings } from 'types/editor/settings'
import { defaultLang } from '@/i18n'

export const defaultSettings: EditorSettings = {
  language: defaultLang,
  processId: `Process_${new Date().getTime()}`,
  processName: `业务流程`,
  processEngine: 'flowable',
  paletteMode: 'enhancement',
  penalMode: 'custom',
  contextPadMode: 'enhancement',
  rendererMode: 'default',
  bg: 'grid-image',
  toolbar: true,
  miniMap: false,
  contextmenu: true,
  customContextmenu: true,
  otherModule: true,
  templateChooser: false,
  useLint: false,
  customTheme: {}
}
