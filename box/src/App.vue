<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- 头部 -->
    <header class="mb-8">
      <h1 class="text-3xl font-bold mb-4 flex items-center gap-2">
        📁 网页收藏盒子
        <span class="text-sm font-normal text-gray-500">(共 {{ bookmarks.length }} 个收藏)</span>
      </h1>

      <!-- 搜索 + 分类筛选 + 导入/导出 + 添加按钮 -->
      <div class="flex flex-col md:flex-row gap-4 items-center">
        <!-- 搜索框（防抖） -->
        <div class="w-full md:flex-1">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索标题/链接..."
            class="input input-bordered w-full"
            aria-label="搜索收藏"
          />
        </div>

        <!-- 分类筛选 -->
        <div class="w-full md:w-48">
          <select
            v-model="activeCategory"
            class="select select-bordered w-full"
            aria-label="分类筛选"
          >
            <option value="all">所有分类</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>

        <!-- 导入 + 导出 + 添加按钮 -->
        <div class="flex gap-3 w-full md:w-auto">
          <button
            @click="openImportDialog"
            class="btn btn-outline btn-accent"
          >
            📥 导入收藏
          </button>
          <button
            @click="exportBookmarks"
            class="btn btn-outline btn-secondary"
            :disabled="bookmarks.length === 0"
          >
            📤 导出收藏
          </button>
          <button
            @click="openDialog('add')"
            class="btn btn-primary"
          >
            + 添加收藏
          </button>
        </div>
      </div>
    </header>

    <!-- 收藏列表（调整网格间距为4，进一步紧凑） -->
    <main ref="gridRef" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- 空状态 -->
      <div v-if="filteredBookmarks.length === 0" class="col-span-full text-center py-12">
        <div class="text-5xl mb-4">📭</div>
        <p class="text-lg text-gray-500">暂无匹配的收藏数据</p>
        <button @click="openDialog('add')" class="btn btn-outline mt-4">
          立即添加第一个收藏
        </button>
      </div>

      <!-- 收藏卡片（新增自定义类名 .small-card 控制尺寸） -->
      <div
        v-for="bookmark in filteredBookmarks"
        :key="bookmark.id"
        class="card card-bordered hover:shadow-lg hover:scale-[1.02] transition-all small-card"
      >
        <div class="card-body">
          <h3 class="card-title truncate text-base"> {{ bookmark.title }}</h3>
          <p class="text-xs text-gray-500 truncate mt-1">{{ bookmark.url }}</p>
          <div class="flex items-center justify-between mt-2">
            <span class="badge badge-outline text-xs">{{ bookmark.category }}</span>
            <span class="text-xs text-gray-500">
              {{ formatTime(bookmark.createTime) }}
            </span>
          </div>
          <div class="card-actions justify-end mt-2">
            <a
              :href="bookmark.url"
              target="_blank"
              class="btn btn-xs btn-outline btn-primary mr-1"
              rel="noopener noreferrer"
            >
              访问
            </a>
            <button
              @click="openDialog('edit', bookmark)"
              class="btn btn-xs btn-outline btn-secondary mr-1"
            >
              编辑
            </button>
            <button
              @click="showDeleteConfirm = true; deleteId = bookmark.id"
              class="btn btn-xs btn-outline btn-error"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- 添加/编辑弹窗 -->
    <div v-if="dialog.show" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">
          {{ dialog.type === 'add' ? '添加收藏' : '编辑收藏' }}
        </h3>
        <form @submit.prevent="submitDialog" class="mt-4 space-y-4">
          <div>
            <label class="label">
              <span class="label-text">标题 *</span>
            </label>
            <input
              v-model="formData.title"
              type="text"
              required
              class="input input-bordered w-full"
              placeholder="如：Vue 官方文档"
              :class="{ 'input-error': formErrors.title }"
            />
            <p v-if="formErrors.title" class="text-xs text-red-500 mt-1">{{ formErrors.title }}</p>
          </div>
          <div>
            <label class="label">
              <span class="label-text">链接 *</span>
            </label>
            <input
              v-model="formData.url"
              type="url"
              required
              class="input input-bordered w-full"
              placeholder="如：https://cn.vuejs.org/"
              :class="{ 'input-error': formErrors.url }"
            />
            <p v-if="formErrors.url" class="text-xs text-red-500 mt-1">{{ formErrors.url }}</p>
          </div>
          <div>
            <label class="label">
              <span class="label-text">分类</span>
            </label>
            <input
              v-model="formData.category"
              type="text"
              class="input input-bordered w-full"
              placeholder="如：开发文档、工具网站（默认：未分类）"
              @blur="formData.category = formData.category.trim()"
            />
          </div>
          <div class="modal-action">
            <button type="button" @click="closeDialog" class="btn btn-outline">
              取消
            </button>
            <button type="submit" class="btn btn-primary">
              {{ dialog.type === 'add' ? '添加' : '保存' }}
            </button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" @click="closeDialog"></div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteConfirm" class="modal modal-open">
      <div class="modal-box max-w-sm">
        <h3 class="font-bold text-lg text-red-500">确认删除</h3>
        <p class="mt-2">确定要删除这个收藏吗？删除后无法恢复！</p>
        <div class="modal-action mt-4">
          <button @click="showDeleteConfirm = false" class="btn btn-outline">取消</button>
          <button @click="confirmDelete" class="btn btn-error">确认删除</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showDeleteConfirm = false"></div>
    </div>

    <!-- 导入收藏弹窗 -->
    <div v-if="importDialog.show" class="modal modal-open">
      <div class="modal-box max-w-md">
        <h3 class="font-bold text-lg">📥 导入收藏</h3>
        <div class="mt-4 space-y-4">
          <!-- 文件选择 -->
          <div>
            <label class="label">
              <span class="label-text">选择JSON文件 *</span>
              <span class="label-text-alt text-gray-500">仅支持本工具导出的 .json 文件</span>
            </label>
            <input
              ref="fileInputRef"
              type="file"
              accept=".json"
              class="file-input file-input-bordered w-full"
              @change="handleFileSelect"
            />
            <p v-if="importErrors.file" class="text-xs text-red-500 mt-1">{{ importErrors.file }}</p>
          </div>

          <!-- 导入模式选择 -->
          <div v-if="importData.length > 0">
            <label class="label">
              <span class="label-text">导入模式</span>
            </label>
            <div class="flex gap-4">
              <label class="cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  v-model="importMode"
                  value="append"
                  class="radio radio-primary"
                  checked
                />
                <span class="ml-2">追加（保留现有数据）</span>
              </label>
              <label class="cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  v-model="importMode"
                  value="cover"
                  class="radio radio-primary"
                />
                <span class="ml-2">覆盖（清空现有数据）</span>
              </label>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              检测到 {{ importData.length }} 条有效收藏数据
            </p>
          </div>

          <!-- 错误提示 -->
          <p v-if="importErrors.data" class="text-xs text-red-500">{{ importErrors.data }}</p>

          <!-- 操作按钮 -->
          <div class="modal-action">
            <button type="button" @click="closeImportDialog" class="btn btn-outline">
              取消
            </button>
            <button
              type="button"
              @click="submitImport"
              class="btn btn-accent"
              :disabled="!importData.length"
            >
              确认导入
            </button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeImportDialog"></div>
    </div>
  </div>
</template>

<script setup>
// 基础导入
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import Sortable from 'sortablejs'
import { useBookmarkStorage } from './utils/storage.js'

// 自定义防抖函数
const debounce = (fn, delay) => {
  let timer = null
  return (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

// 存储相关
const { bookmarks, addBookmark, editBookmark, deleteBookmark, getCategories, reorderBookmarks, replaceAllBookmarks } = useBookmarkStorage()

// 搜索和分类筛选
const searchKeyword = ref('')
const debouncedSearchKeyword = ref('')
const activeCategory = ref('all')

// 防抖处理搜索输入
const debounceSearch = debounce((val) => {
  debouncedSearchKeyword.value = val.trim().toLowerCase()
}, 300)
watch(searchKeyword, (val) => debounceSearch(val))

// 筛选后的收藏列表
const filteredBookmarks = computed(() => {
  return bookmarks.value.filter(bookmark => {
    const matchSearch = 
      bookmark.title.toLowerCase().includes(debouncedSearchKeyword.value) ||
      bookmark.url.toLowerCase().includes(debouncedSearchKeyword.value)
    const matchCategory = activeCategory.value === 'all' || bookmark.category === activeCategory.value
    return matchSearch && matchCategory
  })
})

// 分类列表
const categories = computed(() => {
  return getCategories().sort((a, b) => a.localeCompare(b, 'zh-CN'))
})

// 添加/编辑弹窗
const dialog = ref({
  show: false,
  type: 'add',
  data: null,
})
const formData = ref({
  title: '',
  url: '',
  category: '',
})
const formErrors = ref({
  title: '',
  url: '',
})

// 删除确认弹窗
const showDeleteConfirm = ref(false)
const deleteId = ref('')

// 拖拽相关
const gridRef = ref(null)
let sortableInstance = null

// ========== 导出功能 ==========
const exportBookmarks = () => {
  if (bookmarks.value.length === 0) {
    alert('暂无收藏数据可导出！')
    return
  }

  // 格式化JSON数据
  const exportData = JSON.stringify(bookmarks.value, null, 2)
  const blob = new Blob([exportData], { type: 'application/json; charset=utf-8' })
  const url = URL.createObjectURL(blob)

  // 生成带时间戳的文件名
  const now = new Date()
  const timeStr = now.getFullYear() + 
    String(now.getMonth() + 1).padStart(2, '0') + 
    String(now.getDate()).padStart(2, '0') + 
    '_' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0')
  const fileName = `网页收藏_${timeStr}.json`

  // 触发下载
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()

  // 清理资源
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  alert(`导出成功！共导出 ${bookmarks.value.length} 条收藏数据`)
}

// ========== 导入功能 ==========
// 导入弹窗状态
const importDialog = ref({ show: false })
// 文件输入框引用
const fileInputRef = ref(null)
// 导入错误提示
const importErrors = ref({ file: '', data: '' })
// 解析后的有效数据
const importData = ref([])
// 导入模式：append（追加）/ cover（覆盖）
const importMode = ref('append')

// 打开导入弹窗
const openImportDialog = () => {
  // 重置导入状态
  importDialog.value.show = true
  importErrors.value = { file: '', data: '' }
  importData.value = []
  importMode.value = 'append'
  // 清空文件选择
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// 关闭导入弹窗
const closeImportDialog = () => {
  importDialog.value.show = false
  importErrors.value = { file: '', data: '' }
  importData.value = []
}

// 处理文件选择
const handleFileSelect = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  // 校验文件类型
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    importErrors.value.file = '请选择有效的 JSON 文件！'
    importData.value = []
    return
  }
  importErrors.value.file = ''

  // 读取文件内容
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      // 解析JSON
      const rawData = JSON.parse(event.target.result)
      // 校验数据结构
      const validData = validateImportData(rawData)
      
      if (validData.length > 0) {
        importData.value = validData
        importErrors.value.data = ''
      } else {
        importErrors.value.data = '文件中未检测到有效收藏数据，请检查文件格式！'
        importData.value = []
      }
    } catch (error) {
      importErrors.value.data = 'JSON 文件解析失败，请确认文件未损坏！'
      importData.value = []
      console.error('导入文件解析错误：', error)
    }
  }
  reader.readAsText(file)
}

// 校验导入数据格式
const validateImportData = (data) => {
  if (!Array.isArray(data)) return []

  // 过滤并校验每条数据
  return data.filter(item => {
    // 核心字段校验：title 和 url 必须存在
    if (!item?.title || !item?.url) return false
    
    // 补全默认值
    return {
      id: item.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5), // 兼容旧数据ID
      title: item.title.trim(),
      url: item.url.trim(),
      category: item.category?.trim() || '未分类',
      createTime: item.createTime || new Date().toISOString()
    }
  })
}

// 提交导入
const submitImport = () => {
  if (importData.value.length === 0) return

  try {
    if (importMode.value === 'cover') {
      // 覆盖模式：清空现有数据，替换为导入数据
      replaceAllBookmarks([...importData.value])
      alert(`导入成功！已覆盖原有数据，共导入 ${importData.value.length} 条收藏`)
    } else {
      // 追加模式：逐条添加（自动去重：URL相同则跳过）
      let successCount = 0
      let skipCount = 0
      
      importData.value.forEach(item => {
        // 检查URL是否已存在
        const isDuplicate = bookmarks.value.some(b => b.url.trim() === item.url.trim())
        if (!isDuplicate) {
          addBookmark(item)
          successCount++
        } else {
          skipCount++
        }
      })
      
      alert(`导入完成！新增 ${successCount} 条，跳过重复URL ${skipCount} 条`)
    }

    // 关闭弹窗并重置状态
    closeImportDialog()
  } catch (error) {
    importErrors.value.data = '导入失败：' + error.message
    console.error('导入处理错误：', error)
  }
}

// ========== 原有逻辑保持不变 ==========
// 打开添加/编辑弹窗
const openDialog = (type, data = null) => {
  formErrors.value = { title: '', url: '' }
  dialog.value = {
    show: true,
    type,
    data,
  }
  if (type === 'edit' && data) {
    formData.value = { ...data }
  } else {
    formData.value = { title: '', url: '', category: '' }
  }
}

// 关闭添加/编辑弹窗
const closeDialog = () => {
  dialog.value.show = false
  formErrors.value = { title: '', url: '' }
}

// 表单验证
const validateForm = () => {
  const errors = { title: '', url: '' }
  let isValid = true

  if (!formData.value.title.trim()) {
    errors.title = '标题不能为空'
    isValid = false
  }

  if (!formData.value.url.trim()) {
    errors.url = '链接不能为空'
    isValid = false
  } else {
    // 补全HTTP协议
    const url = formData.value.url.trim()
    if (!/^https?:\/\//i.test(url)) {
      formData.value.url = `https://${url}`
    }
    // 校验URL格式
    try {
      new URL(formData.value.url)
    } catch (e) {
      errors.url = '链接格式不正确'
      isValid = false
    }
  }

  formErrors.value = errors
  return isValid
}

// 提交添加/编辑表单
const submitDialog = () => {
  if (!validateForm()) return

  const category = formData.value.category.trim() || '未分类'
  if (dialog.value.type === 'add') {
    addBookmark({
      title: formData.value.title.trim(),
      url: formData.value.url.trim(),
      category,
    })
  } else if (dialog.value.type === 'edit' && dialog.value.data) {
    editBookmark(dialog.value.data.id, {
      title: formData.value.title.trim(),
      url: formData.value.url.trim(),
      category,
    })
  }
  closeDialog()
}

// 确认删除
const confirmDelete = () => {
  if (deleteId.value) {
    deleteBookmark(deleteId.value)
    showDeleteConfirm.value = false
  }
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
}

// 初始化拖拽排序
const initSortable = () => {
  if (!gridRef.value || sortableInstance) return

  sortableInstance = new Sortable(gridRef.value, {
    animation: 150,
    handle: '.card',
    ghostClass: 'bg-gray-100',
    filter: '.col-span-full',
    onEnd: (evt) => {
      const { oldIndex, newIndex } = evt
      if (oldIndex === -1 || newIndex === -1) return

      const movedItem = filteredBookmarks.value[oldIndex]
      const originalList = [...bookmarks.value]
      const originalOldIndex = originalList.findIndex(item => item.id === movedItem.id)
      const targetItem = filteredBookmarks.value[newIndex]
      const originalNewIndex = originalList.findIndex(item => item.id === targetItem.id)

      reorderBookmarks(originalOldIndex, originalNewIndex)
    },
  })
}

// 监听列表变化重新初始化拖拽
watch([bookmarks, activeCategory, debouncedSearchKeyword], () => {
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }
  initSortable()
})

// 生命周期
onMounted(() => {
  initSortable()
})

onUnmounted(() => {
  if (sortableInstance) {
    sortableInstance.destroy()
  }
})
</script>

<style scoped>
/* 基础样式 */
.card {
  transition: all 0.15s ease;
}
.col-span-full {
  grid-column: 1 / -1;
}
.input-error {
  border-color: #ef4444;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 导入弹窗样式优化 */
.file-input {
  border-radius: 0.5rem;
}
.radio {
  margin-top: 0.25rem;
}

/* 核心修改：缩小卡片尺寸 */
.small-card {
  padding: 0.25rem; /* 卡片外层内边距 */
}
.small-card .card-body {
  padding: 0.75rem; /* 卡片内容内边距（关键缩小项） */
  padding-bottom: 0.5rem;
}
.small-card .card-title {
  font-size: 0.875rem; /* 标题字体缩小 */
  margin-bottom: 0.25rem;
}
.small-card .badge {
  padding: 0.1rem 0.4rem; /* 徽章内边距缩小 */
  font-size: 0.7rem;
}
.small-card .btn-xs {
  padding: 0.1rem 0.4rem; /* 超小按钮内边距 */
  font-size: 0.7rem;
  height: auto;
  line-height: 1.2;
}
.small-card .card-actions {
  margin-top: 0.5rem !important; /* 按钮区域上间距缩小 */
}
</style>