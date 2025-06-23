// AI API管理模块
class AIApiManager {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30分钟缓存
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1秒
  }

  // 调用AI分析
  async analyzeWithAI(html, settings, localDetection = null) {
    const cacheKey = this.generateCacheKey(html, settings, localDetection);
    
    // 检查缓存
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const provider = settings.aiProviders[settings.defaultProvider];
    
    if (!provider || !provider.enabled || !provider.apiKey) {
      throw new Error('请先配置AI提供商');
    }

    const prompt = this.buildAnalysisPrompt(html, settings.analysisDepth, localDetection);
    
    let lastError;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await this.callProvider(settings.defaultProvider, provider, prompt);
        
        // 缓存结果
        this.setCache(cacheKey, result);
        
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`AI API调用失败 (尝试 ${attempt}/${this.retryAttempts}):`, error.message);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    throw new Error(`AI分析失败 (已重试${this.retryAttempts}次): ${lastError.message}`);
  }

  // 调用具体的AI提供商
  async callProvider(providerKey, provider, prompt) {
    switch (providerKey) {
      case 'openai':
        return await this.callOpenAI(provider, prompt);
      case 'gemini':
        return await this.callGemini(provider, prompt);
      case 'claude':
        return await this.callClaude(provider, prompt);
      default:
        throw new Error(`不支持的AI提供商: ${providerKey}`);
    }
  }

  // OpenAI API调用
  async callOpenAI(provider, prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    try {
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的网站技术栈分析专家。请仔细分析提供的HTML代码，识别其中使用的技术栈，并以JSON格式返回结构化的分析结果。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API错误 (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('OpenAI API返回格式异常');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('OpenAI API请求超时');
      }
      throw error;
    }
  }

  // Google Gemini API调用
  async callGemini(provider, prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `你是一个专业的网站技术栈分析专家。${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2000
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API错误 (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Gemini API返回格式异常');
      }

      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Gemini API请求超时');
      }
      throw error;
    }
  }

  // Anthropic Claude API调用
  async callClaude(provider, prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${provider.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': provider.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: 2000,
          temperature: 0.1,
          system: '你是一个专业的网站技术栈分析专家。请仔细分析提供的HTML代码，识别其中使用的技术栈，并以JSON格式返回结构化的分析结果。',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Claude API错误 (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.content || !data.content[0]) {
        throw new Error('Claude API返回格式异常');
      }

      return data.content[0].text.trim();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Claude API请求超时');
      }
      throw error;
    }
  }

  // 构建分析提示词
  buildAnalysisPrompt(html, depth, localDetection = null) {
    // 清理和截取HTML内容
    const cleanHtml = this.cleanHtml(html);
    
    let localDetectionInfo = '';
    if (localDetection) {
      localDetectionInfo = `

本地检测已识别的技术栈：
${JSON.stringify(localDetection, null, 2)}

请基于本地检测结果进行验证和补充，纠正可能的错误，并添加本地检测无法识别的技术。`;
    }
    
    const basePrompt = `请分析以下HTML代码，识别网站使用的技术栈，并用自然语言详细说明分析结果。${localDetectionInfo}\n\nHTML内容（已截取关键部分）：\n${cleanHtml}`;

    if (depth === 'comprehensive') {
      return basePrompt + `\n\n请提供全面详细的分析，包括：\n1. 技术版本信息（如果可以检测到）\n2. 架构模式分析\n3. 性能优化建议\n4. 安全性评估\n5. 技术选型合理性分析\n6. 与本地检测结果的对比和验证`;
    } else if (depth === 'detailed') {
      return basePrompt + `\n\n请提供详细的分析，包括：\n1. 主要技术识别和版本\n2. 架构特点\n3. 基本的性能和安全评估\n4. 验证和补充本地检测结果`;
    } else {
      return basePrompt + `\n\n请提供基础的技术栈识别，重点关注主要的前端和后端技术，并验证本地检测结果的准确性。`;
    }
  }

  // 清理HTML内容
  cleanHtml(html) {
    // 移除注释
    let cleaned = html.replace(/<!--[\s\S]*?-->/g, '');
    
    // 保留重要的标签和属性
    const importantPatterns = [
      /<script[^>]*src[^>]*>/gi,
      /<link[^>]*rel=["']stylesheet["'][^>]*>/gi,
      /<meta[^>]*>/gi,
      /<title[^>]*>.*?<\/title>/gi,
      /data-[^=]*=["'][^"']*["']/gi,
      /ng-[^=]*=["'][^"']*["']/gi,
      /v-[^=]*=["'][^"']*["']/gi,
      /react[^=]*=["'][^"']*["']/gi
    ];
    
    let extracted = '';
    importantPatterns.forEach(pattern => {
      const matches = cleaned.match(pattern);
      if (matches) {
        extracted += matches.join('\n') + '\n';
      }
    });
    
    // 如果提取的内容太少，包含更多body内容
    if (extracted.length < 1000) {
      const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        extracted += bodyMatch[1].substring(0, 3000);
      }
    }
    
    // 限制总长度
    return extracted.substring(0, 8000);
  }

  // 生成缓存键
  generateCacheKey(html, settings, localDetection = null) {
    const content = html.substring(0, 1000); // 使用HTML前1000字符
    const config = `${settings.defaultProvider}-${settings.analysisDepth}`;
    const localInfo = localDetection ? JSON.stringify(localDetection).substring(0, 200) : '';
    return btoa(content + config + localInfo).substring(0, 50);
  }

  // 获取缓存
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  // 设置缓存
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // 清理过期缓存
    if (this.cache.size > 100) {
      this.cleanExpiredCache();
    }
  }

  // 清理过期缓存
  cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取API使用统计
  getUsageStats() {
    // 这里可以实现API使用统计功能
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0
    };
  }
}

export { AIApiManager };

