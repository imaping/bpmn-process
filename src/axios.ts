import axios from 'axios'
// 创建一个axios实例
const instance = axios.create({
  baseURL: 'http://192.168.2.235',
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ATT-2-JnSCW2I8fMPu-sK6mAVDZaoEnaHiJkdh'
  }
})

export default instance
