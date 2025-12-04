import { ref } from 'vue'

const STORAGE_KEY = 'web_bookmarks'

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

// 初始化默认数据
const initDefaultData = () => {
  const defaultBookmarks = [
    {
      id: generateId(),
      title: 'Vue 官方文档',
      url: 'https://cn.vuejs.org/',
      category: '开发文档',
      createTime: new Date().toISOString(),
    },
    {
      id: generateId(),
      title: 'DaisyUI 组件库',
      url: 'https://daisyui.com/',
      category: 'UI 组件',
      createTime: new Date().toISOString(),
    },
  ]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBookmarks))
  return defaultBookmarks
}

// 获取书签
const getBookmarks = () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return initDefaultData()
  try {
    return JSON.parse(raw)
  } catch (e) {
    console.error('解析书签数据失败，使用默认数据', e)
    return initDefaultData()
  }
}

// 保存书签
const saveBookmarks = (bookmarks) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
}

// 组合式函数
export const useBookmarkStorage = () => {
  const bookmarks = ref(getBookmarks())

  // 添加书签
  const addBookmark = (bookmark) => {
    const newBookmark = {
      id: generateId(),
      createTime: new Date().toISOString(),
      ...bookmark,
    }
    bookmarks.value.unshift(newBookmark)
    saveBookmarks(bookmarks.value)
  }

  // 编辑书签
  const editBookmark = (id, updateData) => {
    const index = bookmarks.value.findIndex(item => item.id === id)
    if (index !== -1) {
      bookmarks.value[index] = {
        ...bookmarks.value[index],
        ...updateData,
        createTime: bookmarks.value[index].createTime,
      }
      saveBookmarks(bookmarks.value)
    }
  }

  // 删除书签
  const deleteBookmark = (id) => {
    bookmarks.value = bookmarks.value.filter(item => item.id !== id)
    saveBookmarks(bookmarks.value)
  }

  // 重新排序
  const reorderBookmarks = (oldIndex, newIndex) => {
    const newList = [...bookmarks.value]
    const [movedItem] = newList.splice(oldIndex, 1)
    newList.splice(newIndex, 0, movedItem)
    bookmarks.value = newList
    saveBookmarks(bookmarks.value)
  }

  // 替换所有书签（导入覆盖模式用，新增核心方法）
  const replaceAllBookmarks = (newBookmarks) => {
    // 确保每条数据都有合法ID和创建时间
    const validBookmarks = newBookmarks.map(item => ({
      id: item.id || generateId(),
      title: item.title.trim(),
      url: item.url.trim(),
      category: item.category?.trim() || '未分类',
      createTime: item.createTime || new Date().toISOString()
    }))
    
    bookmarks.value = validBookmarks
    saveBookmarks(bookmarks.value)
  }

  // 获取分类
  const getCategories = () => {
    const categories = bookmarks.value.map(item => item.category || '未分类')
    return [...new Set(categories)]
  }

  return {
    bookmarks,
    addBookmark,
    editBookmark,
    deleteBookmark,
    reorderBookmarks,
    replaceAllBookmarks, // 导出新增方法
    getCategories,
  }
}

// 非Vue环境兼容导出
export const bookmarkStorage = {
  getBookmarks,
  saveBookmarks,
  addBookmark: (bookmark) => {
    const list = getBookmarks()
    const newBookmark = {
      id: generateId(),
      createTime: new Date().toISOString(),
      ...bookmark,
    }
    list.unshift(newBookmark)
    saveBookmarks(list)
    return newBookmark
  },
  editBookmark: (id, updateData) => {
    const list = getBookmarks()
    const index = list.findIndex(item => item.id === id)
    if (index !== -1) {
      list[index] = { ...list[index], ...updateData }
      saveBookmarks(list)
      return list[index]
    }
    return null
  },
  deleteBookmark: (id) => {
    const list = getBookmarks().filter(item => item.id !== id)
    saveBookmarks(list)
    return list
  },
  reorderBookmarks: (oldIndex, newIndex) => {
    const list = getBookmarks()
    const [movedItem] = list.splice(oldIndex, 1)
    list.splice(newIndex, 0, movedItem)
    saveBookmarks(list)
    return list
  },
  replaceAllBookmarks: (newBookmarks) => { // 新增
    const validBookmarks = newBookmarks.map(item => ({
      id: item.id || generateId(),
      title: item.title.trim(),
      url: item.url.trim(),
      category: item.category?.trim() || '未分类',
      createTime: item.createTime || new Date().toISOString()
    }))
    saveBookmarks(validBookmarks)
    return validBookmarks
  },
  getCategories: () => {
    const list = getBookmarks()
    const categories = list.map(item => item.category || '未分类')
    return [...new Set(categories)]
  },
}