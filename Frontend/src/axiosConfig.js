import axios from 'axios'

// Configure axios baseURL for Electron
if (window?.appEnv && window.appEnv.isElectron) {
  axios.defaults.baseURL = 'http://localhost:5000'
}

export default axios
