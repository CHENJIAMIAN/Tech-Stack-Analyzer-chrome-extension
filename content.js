// Content Script - 在网页中运行
class ContentAnalyzer {
  constructor() {
    this.setupMessageListener();
    this.initUI();
  }

  initUI() {
    // 根据存储的设置决定是否显示按钮，默认不显示
    chrome.storage.sync.get({ showAnalysisButton: false }, (items) => {
      if (items.showAnalysisButton) {
        this.injectAnalysisButton();
      }
    });

    // 监听设置变化，动态显示或隐藏按钮
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes.showAnalysisButton) {
        const { newValue } = changes.showAnalysisButton;
        if (newValue) {
          this.injectAnalysisButton();
        } else {
          this.removeAnalysisButton();
        }
      }
    });
  }

  setupMessageListener() {
    // 监听来自background script的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'getPageInfo':
        sendResponse(this.getPageInfo());
        break;
      case 'highlightTechStack':
        this.highlightTechStack(request.data);
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  }

  // 获取页面信息
  getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      html: document.documentElement.outerHTML,
      scripts: this.getScriptTags(),
      stylesheets: this.getStylesheets(),
      metaTags: this.getMetaTags(),
      headers: this.getHeaders()
    };
  }

  // 获取脚本标签
  getScriptTags() {
    const scripts = Array.from(document.querySelectorAll('script'));
    return scripts.map(script => ({
      src: script.src,
      content: script.innerHTML.substring(0, 500), // 限制内容长度
      type: script.type,
      async: script.async,
      defer: script.defer
    }));
  }

  // 获取样式表
  getStylesheets() {
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
    return stylesheets.map(sheet => ({
      href: sheet.href,
      content: sheet.innerHTML ? sheet.innerHTML.substring(0, 500) : '',
      media: sheet.media
    }));
  }

  // 获取meta标签
  getMetaTags() {
    const metaTags = Array.from(document.querySelectorAll('meta'));
    return metaTags.map(meta => ({
      name: meta.name,
      property: meta.property,
      content: meta.content,
      httpEquiv: meta.httpEquiv
    }));
  }

  // 获取响应头信息（通过performance API）
  getHeaders() {
    try {
      const entries = performance.getEntriesByType('navigation');
      if (entries.length > 0) {
        return {
          serverTiming: entries[0].serverTiming || [],
          transferSize: entries[0].transferSize,
          encodedBodySize: entries[0].encodedBodySize
        };
      }
    } catch (error) {
      console.warn('无法获取性能信息:', error);
    }
    return {};
  }

  // 注入分析按钮（可选功能）
  injectAnalysisButton() {
    // 创建浮动分析按钮
    const button = document.createElement('div');
    button.id = 'tech-stack-analyzer-btn';
    button.innerHTML = '🔍';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: #4285f4;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10000;
      font-size: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      opacity: 0.8;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.opacity = '1';
      button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.opacity = '0.8';
      button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', () => {
      this.triggerAnalysis(false);
    });

    // 检查是否已存在按钮
    if (!document.getElementById('tech-stack-analyzer-btn')) {
      document.body.appendChild(button);
    }
  }

  // 移除分析按钮
  removeAnalysisButton() {
    const button = document.getElementById('tech-stack-analyzer-btn');
    if (button) {
      button.remove();
    }
  }

  // 触发分析
  async triggerAnalysis(forceNew = false) {
    try {
      // 显示加载状态
      this.showLoadingState();
      
      // 默认设置
      const defaultSettings = {
        defaultProvider: 'openai',
        analysisDepth: 'detailed',
        autoAnalyze: false
      };

      // 读取最新AI配置
      const { settings: rawSettings } = await new Promise((resolve) => {
        chrome.storage.sync.get(['settings'], resolve);
      });
      const settings = { ...defaultSettings, ...(rawSettings || {}) };

      // 发送分析请求到background script，带上最新settings和forceNew
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeCurrentPage',
        settings, // 这里带上最新配置
        forceNew  // 新增字段，标记是否强制重新生成
      });

      if (response.success) {
        this.showAnalysisResult(response.data);
      } else {
        this.showError(response.error);
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  // 显示加载状态
  showLoadingState() {
    const button = document.getElementById('tech-stack-analyzer-btn');
    if (button) {
      button.innerHTML = '⏳';
      button.style.animation = 'spin 1s linear infinite';
    }

    // 添加旋转动画
    if (!document.getElementById('tech-stack-analyzer-style')) {
      const style = document.createElement('style');
      style.id = 'tech-stack-analyzer-style';
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 显示分析结果
  showAnalysisResult(data) {
    // 恢复按钮状态
    const button = document.getElementById('tech-stack-analyzer-btn');
    if (button) {
      button.innerHTML = '✅';
      button.style.animation = 'none';
      setTimeout(() => {
        button.innerHTML = '🔍';
      }, 2000);
    }

    // 创建结果弹窗
    this.createResultModal(data);
  }

  // 显示错误
  showError(error) {
    const button = document.getElementById('tech-stack-analyzer-btn');
    if (button) {
      button.innerHTML = '❌';
      button.style.animation = 'none';
      setTimeout(() => {
        button.innerHTML = '🔍';
      }, 2000);
    }

    // 显示错误提示
    this.showToast(`分析失败: ${error}`, 'error');
  }

  // 创建结果模态框
  createResultModal(data) {
    // 移除已存在的模态框
    const existingModal = document.getElementById('tech-stack-analyzer-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'tech-stack-analyzer-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #333;">技术栈分析结果</h2>
        <div>
          <button id="regenerate-analysis" style="background: none; border: none; font-size: 18px; cursor: pointer; margin-right: 10px; color: #4285f4;">🔄 重新生成</button>
          <button id="close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
        </div>
      </div>
      <div style="margin-bottom: 15px;">
        <strong>网站:</strong> ${data.title}<br>
        <strong>URL:</strong> ${data.url}<br>
        <strong>分析时间:</strong> ${new Date(data.timestamp).toLocaleString()}<br>
        <strong>AI提供商:</strong> ${data.provider}
      </div>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; white-space: pre-wrap; font-family: monospace; font-size: 14px;">${DOMPurify.sanitize(marked.parse(data.analysis))}</div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // 绑定关闭事件
    document.getElementById('close-modal').addEventListener('click', () => {
      modal.remove();
    });

    // 绑定重新生成事件
    document.getElementById('regenerate-analysis').addEventListener('click', () => {
      modal.remove();
      this.triggerAnalysis(true);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // 显示提示消息
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${type === 'error' ? '#f44336' : '#4285f4'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10002;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      max-width: 300px;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // 高亮技术栈元素（可选功能）
  highlightTechStack(techStack) {
    // 根据分析结果高亮页面中的相关元素
    // 这里可以实现更复杂的高亮逻辑
    console.log('高亮技术栈:', techStack);
  }
}

// 初始化内容脚本
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentAnalyzer();
  });
} else {
  new ContentAnalyzer();
}

