const isDev = process.env.NODE_ENV === 'development'

const appConfig = {
  // API基础URL
  API_BASE_URL: isDev
    ? 'http://localhost:8080'
    : 'https://your-production-api.com',

  // 静态资源基础URL
  STATIC_BASE_URL: isDev
    ? 'http://localhost:8080'
    : 'https://your-production-static.com',

  APP_NAME: 'Campus Forward',
  VERSION: '1.0.0',
}

export default appConfig
