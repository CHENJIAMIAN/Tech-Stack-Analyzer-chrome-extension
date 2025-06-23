// Popup Script - 插件弹出窗口的逻辑
const defaultSettings = {
    defaultProvider: 'openai',
    analysisDepth: 'detailed',
    autoAnalyze: false
}

document.addEventListener("DOMContentLoaded", () => {
    const analyzeBtn = document.getElementById("analyze-btn")
    const configBtn = document.getElementById("config-btn")
    const historyBtn = document.getElementById("history-btn")
    const statusContainer = document.getElementById("status-container")
    const resultSection = document.getElementById("result-section")
    const resultContainer = document.getElementById("result-container")
    const providersStatus = document.getElementById("providers-status")
    const showButtonToggle = document.getElementById("show-button-toggle")
    const defaultProviderSelect = document.getElementById("default-provider")
    const analysisDepthSelect = document.getElementById("analysis-depth")
    const autoAnalyzeToggle = document.getElementById("auto-analyze-toggle")
    const saveSettingsBtn = document.getElementById("save-settings-btn")

    // 初始化
    async function init () {
        await updateProviderStatus()
        await loadPopupSettings()
        // 可以在这里加载上次的分析结果或状态
    }

    // 更新AI提供商配置状态
    async function updateProviderStatus () {
        try {
            const settings = await getSettings()
            if (settings && settings.aiProviders) {
                for (const providerKey in settings.aiProviders) {
                    const provider = settings.aiProviders[providerKey]
                    const statusDiv = providersStatus.querySelector(
                        `.config-status[data-provider="${providerKey}"]`
                    )
                    if (statusDiv) {
                        const indicator = statusDiv.querySelector(".config-indicator")
                        if (provider.enabled && provider.apiKey) {
                            indicator.classList.add("active")
                            statusDiv.classList.add("configured")
                        } else {
                            indicator.classList.remove("active")
                            statusDiv.classList.remove("configured")
                        }
                    }
                }
            }
        } catch (error) {
            showStatus(`获取配置失败: ${error.message}`, "error")
        }
    }

    // 加载弹窗的设置
    async function loadPopupSettings () {
        try {
            const result = await chrome.storage.sync.get(["settings", "showAnalysisButton"])
            // 合并默认值，保证 settings 始终有这些属性
            const settings = { ...defaultSettings, ...(result.settings || {}) }
            showButtonToggle.checked = result.showAnalysisButton || false
            defaultProviderSelect.value = settings.defaultProvider
            analysisDepthSelect.value = settings.analysisDepth
            autoAnalyzeToggle.checked = settings.autoAnalyze
        } catch (error) {
            showStatus(`加载弹窗设置失败: ${error.message}`, 'error')
        }
    }

    // 保存弹窗的设置
    async function savePopupSettings () {
        try {
            const result = await chrome.storage.sync.get(["settings"])
            const currentSettings = result.settings || {}

            const newSettings = {
                ...currentSettings,
                defaultProvider: defaultProviderSelect.value,
                analysisDepth: analysisDepthSelect.value,
                autoAnalyze: autoAnalyzeToggle.checked,
            }

            await chrome.storage.sync.set({
                settings: newSettings,
                showAnalysisButton: showButtonToggle.checked
            })

            // 通知background script设置已更新
            chrome.runtime.sendMessage({ action: 'settingsUpdated' })
            showStatus('设置已保存！', 'success')
        } catch (error) {
            showStatus(`保存设置失败: ${error.message}`, 'error')
        }
    }

    // 分析当前页面
    analyzeBtn.addEventListener("click", async () => {
        showLoading(true)
        resultSection.classList.add("hidden")
        resultContainer.innerHTML = ""
        showStatus("正在分析页面...", "info")

        try {
            const response = await chrome.runtime.sendMessage({
                action: "analyzeCurrentPage",
            })

            if (response.success) {
                displayResult(response.data)
                showStatus("分析完成！", "success")
            } else {
                showStatus(`分析失败: ${response.error}`, "error")
            }
        } catch (error) {
            showStatus(`分析时发生错误: ${error.message}`, "error")
        }
        showLoading(false)
    })

    // 保存设置按钮
    saveSettingsBtn.addEventListener("click", savePopupSettings)

    // 打开配置页面
    configBtn.addEventListener("click", () => {
        chrome.runtime.openOptionsPage
            ? chrome.runtime.openOptionsPage()
            : window.open(chrome.runtime.getURL("config.html"))
    })

    // 查看历史记录 (暂未实现)
    historyBtn.addEventListener("click", () => {
        // 打开历史记录页面
        chrome.tabs.create({
            url: chrome.runtime.getURL("history.html")
        })
    })

    // 显示分析结果
    function displayResult (data) {
        resultSection.classList.remove("hidden")
        let formattedResult = data.analysis.trim()
        const unsafeHtml = marked.parse(formattedResult)
        const safeHtml = DOMPurify.sanitize(unsafeHtml)
        resultContainer.innerHTML = `
      <p><strong>网站:</strong> ${data.title || "N/A"}</p>
      <p><strong>URL:</strong> ${data.url}</p>
      <p><strong>AI提供商:</strong> ${data.provider}</p>
      <p><strong>时间:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
      <div>${safeHtml}</div>
    `
    }

    // 显示状态消息
    function showStatus (message, type = "info") {
        statusContainer.innerHTML = "" // 清除旧消息
        const statusDiv = document.createElement("div")
        statusDiv.className = `status status-${type}`
        statusDiv.textContent = message
        statusContainer.appendChild(statusDiv)

        // 5秒后自动清除消息
        setTimeout(() => {
            if (statusContainer.contains(statusDiv)) {
                statusContainer.removeChild(statusDiv)
            }
        }, 5000)
    }

    // 显示/隐藏加载动画
    function showLoading (isLoading) {
        analyzeBtn.disabled = isLoading
        if (isLoading) {
            analyzeBtn.innerHTML =
                '<span class="spinner"></span><span>正在分析...</span>'
        } else {
            analyzeBtn.innerHTML =
                '<span>🚀</span><span>分析当前页面</span>'
        }
    }

    // 获取设置
    async function getSettings () {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: "getSettings" }, (response) => {
                if (response && response.success) {
                    resolve(response.data)
                } else {
                    reject(new Error(response ? response.error : "无法连接到背景脚本"))
                }
            })
        })
    }

    // HTML转义，防止XSS
    function escapeHtml (unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
    }

    // 监听来自background.js的配置更新消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "settingsUpdated") {
            updateProviderStatus()
            showStatus("配置已更新！", "success")
        }
    })

    init()
});

