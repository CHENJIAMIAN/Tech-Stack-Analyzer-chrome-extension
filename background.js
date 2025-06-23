// Background Service Worker
// 导入AI API管理模块
import { AIApiManager } from './ai-api-manager.js';
import { LocalTechDetector } from './local-tech-detector.js';
import { HistoryManager } from './history-manager.js';

// 全局 defaultSettings
const defaultSettings = {
  aiProviders: {
    openai: {
      name: 'OpenAI',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
      enabled: false
    },
    gemini: {
      name: 'Google Gemini',
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-pro',
      enabled: false
    },
    claude: {
      name: 'Anthropic Claude',
      apiKey: '',
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-sonnet-20240229',
      enabled: false
    }
  },
  defaultProvider: 'openai',
  analysisDepth: 'detailed', // basic, detailed, comprehensive
  autoAnalyze: false
};

class TechStackAnalyzer {
  constructor() {
    this.aiManager = new AIApiManager();
    this.localDetector = new LocalTechDetector();
    this.historyManager = new HistoryManager();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 监听插件安装事件
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('Tech Stack Analyzer installed:', details);
      this.initializeDefaultSettings();
    });

    // 监听来自content script或popup的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // 保持消息通道开放
    });

    // 监听标签页更新事件
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.onTabUpdated(tabId, tab);
      }
    });
  }

  // 初始化默认设置
  async initializeDefaultSettings() {
    await chrome.storage.sync.set({ settings: defaultSettings });
  }

  // 处理消息
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'analyzeCurrentPage':
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const tab =tabs[0]
          if (!tab) {
            throw new Error("无法找到有效的活动标签页。");
          }
          const result = await this.analyzeCurrentPage(tab.id, request.settings, request.forceNew);
          // 保存到历史记录
          if (result) {
             await this.historyManager.saveAnalysis(result);
          }
          sendResponse({ success: true, data: result });
          break;
        
        case 'getSettings':
          const settings = await this.getSettings();
          sendResponse({ success: true, data: settings });
          break;
        
        case 'updateSettings':
          await this.updateSettings(request.settings);
          sendResponse({ success: true });
          break;
        
        case 'getPageHTML':
          const html = await this.getPageHTML(sender.tab.id);
          sendResponse({ success: true, data: html });
          break;
        
        case 'getHistory':
          const history = await this.historyManager.getHistory();
          sendResponse({ success: true, data: history });
          break;
        
        case 'getHistoryItem':
          const historyItem = await this.historyManager.getHistoryItem(request.id);
          sendResponse({ success: true, data: historyItem });
          break;
        
        case 'deleteHistoryItem':
          const deleted = await this.historyManager.deleteHistoryItem(request.id);
          sendResponse({ success: deleted });
          break;
        
        case 'clearHistory':
          const cleared = await this.historyManager.clearHistory();
          sendResponse({ success: cleared });
          break;
        
        case 'searchHistory':
          const searchResults = await this.historyManager.searchHistory(request.query);
          sendResponse({ success: true, data: searchResults });
          break;
        
        case 'getStatistics':
          const stats = await this.historyManager.getStatistics();
          sendResponse({ success: true, data: stats });
          break;
        
        case 'exportHistory':
          const exportData = await this.historyManager.exportHistory(request.format);
          sendResponse({ success: true, data: exportData });
          break;
        
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 分析当前页面
  async analyzeCurrentPage(tabId, settingsFromRequest, forceNew = false) {
    try {
      // 获取页面HTML
      const html = await this.getPageHTML(tabId);
      
      // 优先用外部传入的 settings
      const settings = settingsFromRequest || await this.getSettings();
      
      // 调用AI分析，传递 forceNew
      const analysis = await this.callAIAnalysis(html, settings, forceNew);
      
      return analysis;
    } catch (error) {
      throw new Error(`分析页面失败: ${error.message}`);
    }
  }

  // 获取页面HTML
  async getPageHTML(tabId) {
    return new Promise((resolve, reject) => {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
          return {
            html: document.documentElement.outerHTML,
            url: window.location.href,
            title: document.title
          };
        }
      }, (results) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(results[0].result);
        }
      });
    });
  }

  // 调用AI分析
  async callAIAnalysis(pageData, settings, forceNew = false) {
    try {
      // 只用HTML和settings进行AI分析，不传递本地检测结果
      const enhancedAnalysis = await this.aiManager.analyzeWithAI(
        pageData.html, 
        settings,
        forceNew
      );
      return {
        url: pageData.url,
        title: pageData.title,
        aiAnalysis: enhancedAnalysis,
        analysis: enhancedAnalysis,
        timestamp: new Date().toISOString(),
        provider: settings.defaultProvider
      };
    } catch (error) {
      // AI分析失败时，回退本地检测
      const localDetection = this.localDetector.detect(pageData.html, {
        scripts: pageData.scripts || [],
        stylesheets: pageData.stylesheets || [],
        metaTags: pageData.metaTags || []
      });
      return {
        url: pageData.url,
        title: pageData.title,
        localDetection: localDetection,
        analysis: this.formatLocalDetection(localDetection),
        timestamp: new Date().toISOString(),
        provider: 'local-only',
        error: error.message
      };
    }
  }

  // 合并本地检测和AI分析结果
  combineAnalysis(localResult, aiResult) {
    // 直接返回AI分析结果（自然语言），不再强制结构化合并
    if (typeof aiResult === 'string') {
      return aiResult;
    }
    return String(aiResult);
  }

  // 格式化本地检测结果
  formatLocalDetection(localResult) {
    const formatted = {
      frontend: localResult.frontend,
      backend: localResult.backend,
      analytics: localResult.analytics,
      cdn: localResult.cdn,
      hosting: localResult.hosting,
      summary: this.localDetector.generateSummary(localResult),
      confidence: localResult.confidence,
      detectionMethod: 'local-only'
    };
    
    return JSON.stringify(formatted, null, 2);
  }

  // 合并数组，去重
  mergeArrays(arr1, arr2) {
    const combined = [...(arr1 || []), ...(arr2 || [])];
    return [...new Set(combined)];
  }

  // 获取设置
  async getSettings() {
    const result = await chrome.storage.sync.get(['settings']);
    return { ...defaultSettings, ...(result.settings || {}) };
  }

  // 更新设置
  async updateSettings(newSettings) {
    await chrome.storage.sync.set({ settings: newSettings });
  }

  // 标签页更新处理
  async onTabUpdated(tabId, tab) {
    if (tab.url && tab.url.startsWith('http')) {
      const settings = await this.getSettings();
      if (settings.autoAnalyze) {
        // 自动分析功能
        setTimeout(() => {
          this.analyzeCurrentPage(tabId).catch(console.error);
        }, 2000);
      }
    }
  }
}

// 初始化背景脚本
new TechStackAnalyzer();

