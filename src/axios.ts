import axios from 'axios'
// 创建一个axios实例
const instance = axios.create({
  baseURL: 'http://192.168.2.235',
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default instance
