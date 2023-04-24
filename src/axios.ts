import axios from 'axios'
// 创建一个axios实例
const instance = axios.create({
  baseURL: 'http://192.168.2.235',
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ATT-1-v3d44WyuEQBFu3H4xPKQf49QDEFQ4lPy'
  }
})

export default instance
