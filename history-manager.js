// 历史记录管理模块
class HistoryManager {
  constructor() {
    this.maxHistoryItems = 100; // 最大历史记录数量
  }

  // 保存分析结果到历史记录
  async saveAnalysis(analysisResult) {
    try {
      const history = await this.getHistory();
      
      // 创建历史记录项
      const historyItem = {
        id: this.generateId(),
        url: analysisResult.url,
        title: analysisResult.title,
        analysis: analysisResult.analysis,
        localDetection: analysisResult.localDetection,
        provider: analysisResult.provider,
        timestamp: analysisResult.timestamp,
        domain: this.extractDomain(analysisResult.url),
        summary: this.extractSummary(analysisResult.analysis)
      };

      // 添加到历史记录开头
      history.unshift(historyItem);

      // 限制历史记录数量
      if (history.length > this.maxHistoryItems) {
        history.splice(this.maxHistoryItems);
      }

      // 保存到存储
      await chrome.storage.local.set({ analysisHistory: history });
      
      return historyItem.id;
    } catch (error) {
      console.error('保存历史记录失败:', error);
      throw error;
    }
  }

  // 获取历史记录
  async getHistory() {
    try {
      const result = await chrome.storage.local.get(['analysisHistory']);
      return result.analysisHistory || [];
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  }

  // 获取特定历史记录项
  async getHistoryItem(id) {
    const history = await this.getHistory();
    return history.find(item => item.id === id);
  }

  // 删除历史记录项
  async deleteHistoryItem(id) {
    try {
      const history = await this.getHistory();
      const filteredHistory = history.filter(item => item.id !== id);
      await chrome.storage.local.set({ analysisHistory: filteredHistory });
      return true;
    } catch (error) {
      console.error('删除历史记录失败:', error);
      return false;
    }
  }

  // 清空历史记录
  async clearHistory() {
    try {
      await chrome.storage.local.set({ analysisHistory: [] });
      return true;
    } catch (error) {
      console.error('清空历史记录失败:', error);
      return false;
    }
  }

  // 搜索历史记录
  async searchHistory(query) {
    const history = await this.getHistory();
    const lowerQuery = query.toLowerCase();
    
    return history.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.url.toLowerCase().includes(lowerQuery) ||
      item.domain.toLowerCase().includes(lowerQuery) ||
      item.summary.toLowerCase().includes(lowerQuery)
    );
  }

  // 按域名分组历史记录
  async getHistoryByDomain() {
    const history = await this.getHistory();
    const grouped = {};
    
    history.forEach(item => {
      if (!grouped[item.domain]) {
        grouped[item.domain] = [];
      }
      grouped[item.domain].push(item);
    });
    
    return grouped;
  }

  // 获取统计信息
  async getStatistics() {
    const history = await this.getHistory();
    
    const stats = {
      totalAnalyses: history.length,
      uniqueDomains: new Set(history.map(item => item.domain)).size,
      providerUsage: {},
      recentActivity: this.getRecentActivity(history),
      topDomains: this.getTopDomains(history)
    };

    // 统计AI提供商使用情况
    history.forEach(item => {
      const provider = item.provider || 'unknown';
      stats.providerUsage[provider] = (stats.providerUsage[provider] || 0) + 1;
    });

    return stats;
  }

  // 导出历史记录
  async exportHistory(format = 'json') {
    const history = await this.getHistory();
    
    switch (format) {
      case 'json':
        return this.exportAsJSON(history);
      case 'csv':
        return this.exportAsCSV(history);
      case 'html':
        return this.exportAsHTML(history);
      default:
        throw new Error('不支持的导出格式');
    }
  }

  // 导出为JSON
  exportAsJSON(history) {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      totalItems: history.length,
      data: history
    };
    
    return {
      content: JSON.stringify(exportData, null, 2),
      filename: `tech-stack-analysis-${this.formatDate(new Date())}.json`,
      mimeType: 'application/json'
    };
  }

  // 导出为CSV
  exportAsCSV(history) {
    const headers = ['时间', '网站标题', 'URL', '域名', 'AI提供商', '技术栈摘要'];
    const rows = [headers];
    
    history.forEach(item => {
      rows.push([
        new Date(item.timestamp).toLocaleString(),
        item.title,
        item.url,
        item.domain,
        item.provider,
        item.summary
      ]);
    });
    
    const csvContent = rows.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    return {
      content: csvContent,
      filename: `tech-stack-analysis-${this.formatDate(new Date())}.csv`,
      mimeType: 'text/csv'
    };
  }

  // 导出为HTML
  exportAsHTML(history) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>技术栈分析历史记录</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .item { border: 1px solid #ddd; margin-bottom: 20px; border-radius: 8px; overflow: hidden; }
        .item-header { background: #4285f4; color: white; padding: 15px; }
        .item-content { padding: 15px; }
        .meta { color: #666; font-size: 14px; margin-bottom: 10px; }
        .analysis { background: #f9f9f9; padding: 10px; border-radius: 4px; white-space: pre-wrap; font-family: monospace; }
    </style>
</head>
<body>
    <div class="header">
        <h1>技术栈分析历史记录</h1>
        <p>导出时间: ${new Date().toLocaleString()}</p>
        <p>总记录数: ${history.length}</p>
    </div>
    
    ${history.map(item => `
    <div class="item">
        <div class="item-header">
            <h3>${item.title}</h3>
            <div>${item.url}</div>
        </div>
        <div class="item-content">
            <div class="meta">
                分析时间: ${new Date(item.timestamp).toLocaleString()} | 
                AI提供商: ${item.provider} | 
                域名: ${item.domain}
            </div>
            <div class="analysis">${item.analysis}</div>
        </div>
    </div>
    `).join('')}
</body>
</html>`;
    
    return {
      content: htmlContent,
      filename: `tech-stack-analysis-${this.formatDate(new Date())}.html`,
      mimeType: 'text/html'
    };
  }

  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 提取域名
  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  // 提取摘要
  extractSummary(analysis) {
    if (typeof analysis === 'string') {
      return analysis.substring(0, 100) + '...';
    }
    return String(analysis).substring(0, 100) + '...';
  }

  // 获取最近活动
  getRecentActivity(history) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      today: history.filter(item => new Date(item.timestamp) > oneDayAgo).length,
      thisWeek: history.filter(item => new Date(item.timestamp) > oneWeekAgo).length
    };
  }

  // 获取热门域名
  getTopDomains(history) {
    const domainCounts = {};
    history.forEach(item => {
      domainCounts[item.domain] = (domainCounts[item.domain] || 0) + 1;
    });
    
    return Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));
  }

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
}

export { HistoryManager };

