// 历史记录页面脚本
document.addEventListener('DOMContentLoaded', async () => {
  await loadStatistics();
  await loadHistory();
  setupEventListeners();
});

let currentHistory = [];

// 设置事件监听器
function setupEventListeners() {
  // 搜索功能
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce(handleSearch, 300));
  
  // 模态框关闭
  document.getElementById('close-modal-btn').addEventListener('click', closeModal);
  document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target.id === 'detail-modal') {
      closeModal();
    }
  });

  // 头部按钮
  document.getElementById('export-json-btn').addEventListener('click', () => exportHistory('json'));
//   document.getElementById('export-csv-btn').addEventListener('click', () => exportHistory('csv'));
  document.getElementById('clear-history-btn').addEventListener('click', clearAllHistory);

  // 历史记录列表事件委托
  document.getElementById('history-list').addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    if (!action || !id) return;

    if (action === 'view-details') {
      viewDetails(id);
    } else if (action === 'delete-item') {
      deleteItem(id);
    }
  });
}

// 加载统计信息
async function loadStatistics() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStatistics' });
    if (response.success) {
      const stats = response.data;
      document.getElementById('total-analyses').textContent = stats.totalAnalyses;
      document.getElementById('unique-domains').textContent = stats.uniqueDomains;
      document.getElementById('today-analyses').textContent = stats.recentActivity.today;
      document.getElementById('week-analyses').textContent = stats.recentActivity.thisWeek;
    }
  } catch (error) {
    console.error('加载统计信息失败:', error);
  }
}

// 加载历史记录
async function loadHistory() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getHistory' });
    if (response.success) {
      currentHistory = response.data;
      displayHistory(currentHistory);
    } else {
      showError('加载历史记录失败');
    }
  } catch (error) {
    console.error('加载历史记录失败:', error);
    showError('加载历史记录失败');
  }
}

// 显示历史记录
function displayHistory(history) {
  const loading = document.getElementById('loading');
  const historyList = document.getElementById('history-list');
  const emptyState = document.getElementById('empty-state');
  const recordCount = document.getElementById('record-count');
  
  loading.style.display = 'none';
  
  if (history.length === 0) {
    historyList.style.display = 'none';
    emptyState.style.display = 'block';
    recordCount.textContent = '0 条记录';
    return;
  }
  
  emptyState.style.display = 'none';
  historyList.style.display = 'block';
  recordCount.textContent = `${history.length} 条记录`;
  
  historyList.innerHTML = history.map(item => createHistoryItemHTML(item)).join('');
}

// 创建历史记录项HTML
function createHistoryItemHTML(item) {
  const date = new Date(item.timestamp).toLocaleString();
  const domain = item.domain || '未知域名';
  const provider = item.provider || '未知';
  
  return `
    <div class="history-item" data-id="${item.id}">
      <div class="item-header">
        <div>
          <div class="item-title">${escapeHtml(item.title)}</div>
          <a href="${item.url}" class="item-url" target="_blank">${escapeHtml(item.url)}</a>
        </div>
        <div class="item-actions">
          <button class="btn btn-secondary btn-small" data-action="view-details" data-id="${item.id}">
            👁️ 查看详情
          </button>
          <button class="btn btn-danger btn-small" data-action="delete-item" data-id="${item.id}">
            🗑️ 删除
          </button>
        </div>
      </div>
      <div class="item-meta">
        <span>📅 ${date}</span>
        <span>🌐 ${domain}</span>
        <span>🤖 ${provider}</span>
      </div>
      <div class="item-summary">${escapeHtml(item.summary || '无摘要')}</div>
    </div>
  `;
}

// 搜索处理
async function handleSearch(event) {
  const query = event.target.value.trim();
  
  if (query === '') {
    displayHistory(currentHistory);
    return;
  }
  
  try {
    const response = await chrome.runtime.sendMessage({ 
      action: 'searchHistory', 
      query: query 
    });
    
    if (response.success) {
      displayHistory(response.data);
    }
  } catch (error) {
    console.error('搜索失败:', error);
  }
}

// 查看详情
async function viewDetails(id) {
  try {
    const response = await chrome.runtime.sendMessage({ 
      action: 'getHistoryItem', 
      id: id 
    });
    
    if (response.success && response.data) {
      showDetailModal(response.data);
    } else {
      showError('获取详情失败');
    }
  } catch (error) {
    console.error('获取详情失败:', error);
    showError('获取详情失败');
  }
}

// 显示详情模态框
function showDetailModal(item) {
  const modal = document.getElementById('detail-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  
  modalTitle.textContent = item.title;

  const unsafeHtml = marked.parse(item.analysis || '');
  const safeAnalysisHtml = DOMPurify.sanitize(unsafeHtml);
  
  modalBody.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h4>基本信息</h4>
      <p><strong>URL:</strong> <a href="${item.url}" target="_blank">${item.url}</a></p>
      <p><strong>分析时间:</strong> ${new Date(item.timestamp).toLocaleString()}</p>
      <p><strong>AI提供商:</strong> ${item.provider}</p>
      <p><strong>域名:</strong> ${item.domain}</p>
    </div>
    
    ${item.localDetection ? `
    <div style="margin-bottom: 20px;">
      <h4>本地检测结果</h4>
      <div class="analysis-content">${JSON.stringify(item.localDetection, null, 2)}</div>
    </div>
    ` : ''}
    
    <div>
      <h4>完整分析结果</h4>
      <div class="analysis-content">${safeAnalysisHtml}</div>
    </div>
  `;
  
  modal.style.display = 'block';
}

// 关闭模态框
function closeModal() {
  document.getElementById('detail-modal').style.display = 'none';
}

// 删除项目
async function deleteItem(id) {
  if (!confirm('确定要删除这条分析记录吗？')) {
    return;
  }
  
  try {
    const response = await chrome.runtime.sendMessage({ 
      action: 'deleteHistoryItem', 
      id: id 
    });
    
    if (response.success) {
      // 从当前显示的历史记录中移除
      currentHistory = currentHistory.filter(item => item.id !== id);
      displayHistory(currentHistory);
      await loadStatistics(); // 重新加载统计信息
      showSuccess('删除成功');
    } else {
      showError('删除失败');
    }
  } catch (error) {
    console.error('删除失败:', error);
    showError('删除失败');
  }
}

// 清空所有历史记录
async function clearAllHistory() {
  if (!confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
    return;
  }
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'clearHistory' });
    
    if (response.success) {
      currentHistory = [];
      displayHistory(currentHistory);
      await loadStatistics();
      showSuccess('历史记录已清空');
    } else {
      showError('清空历史记录失败');
    }
  } catch (error) {
    console.error('清空失败:', error);
    showError('清空历史记录失败');
  }
}

// 导出历史记录
async function exportHistory(format) {
  try {
    const response = await chrome.runtime.sendMessage({ 
      action: 'exportHistory', 
      format: format 
    });
    
    if (response.success) {
      const exportData = response.data;
      const mimeType = format === 'json' ? 'application/json' : 'text/csv';
      downloadFile(exportData.content, exportData.filename, mimeType);
      showSuccess(`导出成功: ${exportData.filename}`);
    } else {
      showError(`导出${format.toUpperCase()}失败`);
    }
  } catch (error) {
    console.error('导出失败:', error);
    showError(`导出${format.toUpperCase()}失败`);
  }
}

// 下载文件
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 显示成功消息
function showSuccess(message) {
  showToast(message, 'success');
}

// 显示错误消息
function showError(message) {
  showToast(message, 'error');
}

// 显示提示消息
function showToast(message, type = 'info') {
  const toastId = 'toast-notification';
  let toast = document.getElementById(toastId);
  if (toast) {
    toast.remove();
  }
  
  toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// HTML转义，防止XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

