export const themes = {
  light: {
    '--primary-color': '#3498db',
    '--secondary-color': '#e74c3c',
    '--secondary-bg-color': '#f0f0f0',
    '--primary-text-color': '#333',
    '--header-background': '#3498db',
    '--active-text-color': '#fff',
    // ... 其他颜色变量
  },
  dark: {
    '--primary-color': '#2c3e50',
    '--secondary-color': '#c0392b',
    '--secondary-bg-color': '#333',
    '--primary-text-color': '#ecf0f1',
    '--header-background': '#2c3e50',
    '--active-text-color': '#ecf0f1',
    // ... 其他颜色变量
  },
  // 可以添加更多主题
  green: {
    '--primary-color': '#2ecc71',
    '--secondary-color': '#d35400',
    '--secondary-bg-color': '#f9f9f9',
    '--primary-text-color': '#444',
    '--header-background': '#2ecc71',
    '--active-text-color': '#fff',
    // ... 其他颜色变量
  },
}

export type ThemeName = keyof typeof themes
