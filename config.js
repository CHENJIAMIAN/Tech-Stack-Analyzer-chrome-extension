// 配置页面脚本
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
  // 监听启用/禁用切换
  document.querySelectorAll('.toggle-switch input').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const provider = e.target.id.replace('-enabled', '');
      const providerConfig = document.querySelector(`.provider-config[data-provider="${provider}"]`);
      
      if (e.target.checked) {
        providerConfig.classList.add('enabled');
      } else {
        providerConfig.classList.remove('enabled');
      }
    });
  });

  // 监听测试连接按钮
  document.querySelectorAll('.btn-test').forEach(button => {
    button.addEventListener('click', (e) => {
      const provider = e.target.closest('.provider-config').dataset.provider;
      testProvider(provider);
    });
  });

  // 监听保存和重置按钮
  document.querySelector('.btn-primary').addEventListener('click', saveSettings);
  document.querySelector('.btn-secondary').addEventListener('click', resetSettings);
}

// 加载设置
async function loadSettings() {
  try {
    const defaultSettings = {
      defaultProvider: 'openai',
      analysisDepth: 'detailed',
      autoAnalyze: false
    };
    const result = await chrome.storage.sync.get(['settings']);
    const settings = { ...defaultSettings, ...(result.settings || {}) };
    
    if (settings.aiProviders) {
      // 加载AI提供商设置
      for (const providerKey in settings.aiProviders) {
        const provider = settings.aiProviders[providerKey];
        
        // 设置启用状态
        const enabledCheckbox = document.getElementById(`${providerKey}-enabled`);
        if (enabledCheckbox) {
          enabledCheckbox.checked = provider.enabled || false;
          const providerConfig = document.querySelector(`.provider-config[data-provider="${providerKey}"]`);
          if (provider.enabled) {
            providerConfig.classList.add('enabled');
          }
        }
        
        // 设置API Key
        const apiKeyInput = document.getElementById(`${providerKey}-api-key`);
        if (apiKeyInput) {
          apiKeyInput.value = provider.apiKey || '';
        }
        
        // 设置模型
        const modelSelect = document.getElementById(`${providerKey}-model`);
        if (modelSelect) {
          modelSelect.value = provider.model || modelSelect.options[0].value;
        }
        
        // 设置Base URL (仅OpenAI)
        if (providerKey === 'openai') {
          const baseUrlInput = document.getElementById(`${providerKey}-base-url`);
          if (baseUrlInput) {
            baseUrlInput.value = provider.baseUrl || 'https://api.openai.com/v1';
          }
        }
      }
    }
    
  } catch (error) {
    showStatus('加载设置失败: ' + error.message, 'error');
  }
}

// 工具函数：去除末尾所有斜杠
function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, '');
}

// 保存设置
async function saveSettings() {
  try {
    const settings = {
      aiProviders: {
        openai: {
          name: 'OpenAI',
          enabled: document.getElementById('openai-enabled').checked,
          apiKey: document.getElementById('openai-api-key').value,
          baseUrl: normalizeBaseUrl(document.getElementById('openai-base-url').value || 'https://api.openai.com/v1'),
          model: document.getElementById('openai-model').value
        },
        gemini: {
          name: 'Google Gemini',
          enabled: document.getElementById('gemini-enabled').checked,
          apiKey: document.getElementById('gemini-api-key').value,
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
          model: document.getElementById('gemini-model').value
        },
        claude: {
          name: 'Anthropic Claude',
          enabled: document.getElementById('claude-enabled').checked,
          apiKey: document.getElementById('claude-api-key').value,
          baseUrl: 'https://api.anthropic.com/v1',
          model: document.getElementById('claude-model').value
        }
      },
    };
    
    await chrome.storage.sync.set({ settings });
    
    // 通知background script设置已更新
    chrome.runtime.sendMessage({ action: 'settingsUpdated' });
    
    showStatus('设置保存成功！', 'success');
  } catch (error) {
    showStatus('保存设置失败: ' + error.message, 'error');
  }
}

// 重置设置
async function resetSettings() {
  if (confirm('确定要重置所有设置为默认值吗？')) {
    try {
      await chrome.storage.sync.clear();
      location.reload();
    } catch (error) {
      showStatus('重置设置失败: ' + error.message, 'error');
    }
  }
}

// 测试AI提供商连接
async function testProvider(providerKey) {
  const provider = {
    enabled: document.getElementById(`${providerKey}-enabled`).checked,
    apiKey: document.getElementById(`${providerKey}-api-key`).value,
    model: document.getElementById(`${providerKey}-model`).value
  };
  
  if (providerKey === 'openai') {
    provider.baseUrl = normalizeBaseUrl(document.getElementById(`${providerKey}-base-url`).value || 'https://api.openai.com/v1');
  } else if (providerKey === 'gemini') {
    provider.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  } else if (providerKey === 'claude') {
    provider.baseUrl = 'https://api.anthropic.com/v1';
  }
  
  if (!provider.apiKey) {
    showStatus('请先输入API Key', 'error');
    return;
  }
  
  showStatus('正在测试连接...', 'info');
  
  try {
    let response;
    const testPrompt = '请回复"连接测试成功"';
    
    switch (providerKey) {
      case 'openai':
        response = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 50
          })
        });
        break;
        
      case 'gemini':
        response = await fetch(`${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: testPrompt }]
            }]
          })
        });
        break;
        
      case 'claude':
        response = await fetch(`${provider.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': provider.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: provider.model,
            max_tokens: 50,
            messages: [{ role: 'user', content: testPrompt }]
          })
        });
        break;
    }
    
    if (response.ok) {
      showStatus(`${provider.name || providerKey} 连接测试成功！`, 'success');
    } else {
      const errorData = await response.json();
      showStatus(`连接测试失败: ${errorData.error?.message || response.statusText}`, 'error');
    }
  } catch (error) {
    showStatus(`连接测试失败: ${error.message}`, 'error');
  }
}

// 显示状态消息
function showStatus(message, type = 'info') {
  const statusContainer = document.getElementById('status-container');
  statusContainer.innerHTML = '';
  
  const statusDiv = document.createElement('div');
  statusDiv.className = `status-message status-${type}`;
  statusDiv.textContent = message;
  statusContainer.appendChild(statusDiv);
  
  // 5秒后自动清除消息
  setTimeout(() => {
    if (statusContainer.contains(statusDiv)) {
      statusContainer.removeChild(statusDiv);
    }
  }, 5000);
}

