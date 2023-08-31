import axios from 'axios'

let instance
if (process.env.NODE_ENV == 'production') {
  // 创建一个axios实例
  instance = axios.create({
    timeout: 300000,
    headers: {
      'Content-Type': 'application/json'
    }
  })
} else {
  // 创建一个axios实例
  instance = axios.create({
    baseURL: 'http://192.168.2.235',
    timeout: 300000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer AT-13-vd-cv0lzh7htrAk-NWpXRp0EA3lS6ybl'
    }
  })
}

export default instance
