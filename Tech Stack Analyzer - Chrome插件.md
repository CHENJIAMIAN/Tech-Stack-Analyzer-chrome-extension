# Tech Stack Analyzer - Chrome插件

> [English](<Tech Stack Analyzer - Chrome插件.en.md>)

🔍 一个利用AI技术分析网站技术栈的Chrome浏览器插件，支持多种AI API提供商。

## 功能特点

### 🚀 核心功能
- **智能技术栈分析**: 结合本地检测和AI分析，准确识别网站使用的技术栈
- **多AI提供商支持**: 支持OpenAI GPT、Google Gemini、Anthropic Claude等主流AI服务
- **实时分析**: 一键分析当前浏览的网页技术栈
- **历史记录**: 保存分析历史，支持搜索和管理
- **数据导出**: 支持JSON、CSV、HTML格式导出分析结果

### 🎯 检测范围
- **前端技术**: React、Vue.js、Angular、jQuery等框架和库
- **CSS框架**: Bootstrap、Tailwind CSS、Bulma等
- **构建工具**: Webpack、Vite、Parcel等
- **分析工具**: Google Analytics、Facebook Pixel等
- **CDN服务**: Cloudflare、jsDelivr等
- **托管服务**: Vercel、Netlify、GitHub Pages等
- **后端推测**: 基于特征识别可能的后端技术

### 🔧 技术特色
- **混合检测**: 本地模式识别 + AI智能分析
- **缓存机制**: 避免重复分析，提升响应速度
- **错误重试**: 自动重试机制，提高成功率
- **置信度评分**: 为检测结果提供可信度参考

## 安装方法

### 开发者模式安装

1. **下载插件文件**
   ```bash
   # 克隆或下载插件源码到本地
   git clone <repository-url>
   cd tech-stack-analyzer-extension
   ```

2. **打开Chrome扩展管理页面**
   - 在Chrome地址栏输入: `chrome://extensions/`
   - 或者通过菜单: 更多工具 → 扩展程序

3. **启用开发者模式**
   - 点击右上角的"开发者模式"开关

4. **加载插件**
   - 点击"加载已解压的扩展程序"
   - 选择插件文件夹 `tech-stack-analyzer-extension`
   - 插件将自动加载并显示在扩展列表中

5. **固定插件图标**
   - 点击Chrome工具栏右侧的拼图图标
   - 找到"Tech Stack Analyzer"并点击固定图标

## 配置说明

### AI提供商配置

插件支持多种AI服务，需要配置相应的API密钥：

#### 1. OpenAI GPT
- **获取API Key**: 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
- **支持模型**: GPT-3.5 Turbo, GPT-4, GPT-4 Turbo
- **配置项**:
  - API Key: `sk-...`
  - Base URL: `https://api.openai.com/v1` (默认)
  - Model: 选择合适的模型

#### 2. Google Gemini
- **获取API Key**: 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
- **支持模型**: Gemini Pro, Gemini Pro Vision
- **配置项**:
  - API Key: `AIza...`
  - Model: 选择合适的模型

#### 3. Anthropic Claude
- **获取API Key**: 访问 [Anthropic Console](https://console.anthropic.com/)
- **支持模型**: Claude 3 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **配置项**:
  - API Key: `sk-ant-...`
  - Model: 选择合适的模型

### 分析设置

- **默认AI提供商**: 选择主要使用的AI服务
- **分析深度**:
  - 基础分析: 快速识别主要技术
  - 详细分析: 包含版本信息和配置细节
  - 全面分析: 深度分析包含性能和安全建议
- **自动分析**: 页面加载完成后自动进行分析

## 使用方法

### 基本使用

1. **访问目标网站**
   - 在Chrome中打开要分析的网站

2. **启动分析**
   - 点击工具栏中的插件图标
   - 点击"分析当前页面"按钮
   - 等待分析完成

3. **查看结果**
   - 分析结果将显示在弹出窗口中
   - 包含技术栈详情和AI分析摘要

### 高级功能

#### 历史记录管理
- 点击"查看历史记录"打开历史页面
- 支持搜索、查看详情、删除记录
- 提供统计信息和使用趋势

#### 数据导出
- 在历史记录页面点击导出按钮
- 支持JSON、CSV、HTML三种格式
- 包含完整的分析数据和元信息

#### 页面内快速分析
- 网页右上角会显示浮动分析按钮
- 点击可直接在页面内进行分析
- 结果以模态框形式显示

## 文件结构

```
tech-stack-analyzer-extension/
├── manifest.json              # 插件配置文件
├── background.js             # 后台服务脚本
├── content.js               # 内容脚本
├── popup.html               # 弹出窗口界面
├── popup.js                 # 弹出窗口逻辑
├── config.html              # 配置页面
├── config.js                # 配置页面逻辑
├── history.html             # 历史记录页面
├── history.js               # 历史记录逻辑
├── ai-api-manager.js        # AI API管理模块
├── local-tech-detector.js   # 本地技术检测模块
├── history-manager.js       # 历史记录管理模块
├── icons/                   # 插件图标
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md               # 说明文档
```

## 技术架构

### 核心模块

1. **Background Service Worker** (`background.js`)
   - 插件主控制器
   - 处理消息通信
   - 管理分析流程

2. **AI API Manager** (`ai-api-manager.js`)
   - 多AI提供商集成
   - 请求缓存和重试
   - 错误处理

3. **Local Tech Detector** (`local-tech-detector.js`)
   - 本地技术栈识别
   - 模式匹配检测
   - 置信度评分

4. **History Manager** (`history-manager.js`)
   - 历史记录存储
   - 数据导出功能
   - 统计分析

### 数据流程

1. 用户触发分析请求
2. Content Script提取页面信息
3. Local Detector进行本地检测
4. AI API Manager调用AI服务
5. 合并本地和AI分析结果
6. 保存到历史记录
7. 展示给用户

## 常见问题

### Q: 为什么需要配置AI API？
A: 插件使用AI技术进行深度分析，需要调用第三方AI服务。您可以选择任一支持的AI提供商。

### Q: 分析结果不准确怎么办？
A: 可以尝试：
- 切换不同的AI提供商
- 调整分析深度设置
- 检查网站是否完全加载

### Q: 如何保护API密钥安全？
A: API密钥存储在Chrome的本地存储中，不会上传到任何服务器。建议定期更换密钥。

### Q: 插件会收集我的数据吗？
A: 插件仅在本地分析网页内容，不会收集或上传任何个人数据。

## 开发说明

### 开发环境
- Chrome浏览器 (版本88+)
- Manifest V3 规范
- 纯JavaScript实现，无需构建工具

### 本地开发
1. 修改源码文件
2. 在Chrome扩展页面点击"重新加载"
3. 测试功能是否正常

### 贡献指南
欢迎提交Issue和Pull Request来改进插件功能。

## 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。

## 更新日志

### v1.0.0 (2024-12-06)
- 🎉 首次发布
- ✨ 支持多AI提供商分析
- 🔍 本地技术栈检测
- 📊 历史记录管理
- 📤 数据导出功能
- 🎨 现代化用户界面

## 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues: [项目地址]
- Email: [联系邮箱]

---

**Tech Stack Analyzer** - 让技术栈分析变得简单高效！

