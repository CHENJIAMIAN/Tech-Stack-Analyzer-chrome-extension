# Tech Stack Analyzer - Chrome Extension

> [中文](<Tech Stack Analyzer - Chrome插件.md>)

🔍 A Chrome extension that uses AI to analyze a website's technology stack, with
support for multiple AI API providers.

## Features

### 🚀 Core capabilities
- **Intelligent technology-stack analysis**: combines local detection and AI
  analysis to identify a site's technology stack accurately.
- **Multiple AI providers**: supports mainstream services including OpenAI GPT,
  Google Gemini, and Anthropic Claude.
- **Real-time analysis**: analyze the technology stack of the page currently open
  in the browser with one action.
- **History**: saves analysis history and supports search and management.
- **Data export**: exports analysis results as JSON, CSV, or HTML.

### 🎯 Detection scope
- **Frontend technologies**: frameworks and libraries such as React, Vue.js,
  Angular, and jQuery.
- **CSS frameworks**: Bootstrap, Tailwind CSS, Bulma, and more.
- **Build tools**: Webpack, Vite, Parcel, and more.
- **Analytics tools**: Google Analytics, Facebook Pixel, and more.
- **CDN services**: Cloudflare, jsDelivr, and more.
- **Hosting services**: Vercel, Netlify, GitHub Pages, and more.
- **Backend inference**: infers possible backend technologies from detected
  signals.

### 🔧 Technical characteristics
- **Hybrid detection**: local pattern recognition plus AI analysis.
- **Caching**: avoids repeat analysis and improves response time.
- **Error retries**: automatic retries improve success rate.
- **Confidence scores**: gives each detection result a confidence reference.

## Installation

### Install in Developer Mode

1. **Download the extension files**
   ```bash
   # 克隆或下载插件源码到本地
   git clone <repository-url>
   cd tech-stack-analyzer-extension
   ```

2. **Open Chrome Extensions**
   - Enter `chrome://extensions/` in the Chrome address bar.
   - Or open **More tools** → **Extensions** from the menu.

3. **Enable Developer mode**
   - Turn on the **Developer mode** switch in the upper-right corner.

4. **Load the extension**
   - Select **Load unpacked**.
   - Choose the `tech-stack-analyzer-extension` folder.
   - The extension loads automatically and appears in the extension list.

5. **Pin the extension icon**
   - Select the puzzle icon on the right side of the Chrome toolbar.
   - Find **Tech Stack Analyzer** and select its pin icon.

## Configuration

### AI provider configuration

The extension supports several AI services and requires the corresponding API
key.

#### 1. OpenAI GPT
- **Get an API key**: visit [OpenAI Platform](https://platform.openai.com/api-keys).
- **Supported models**: GPT-3.5 Turbo, GPT-4, GPT-4 Turbo.
- **Settings**:
  - API Key: `sk-...`
  - Base URL: `https://api.openai.com/v1` (default)
  - Model: choose an appropriate model

#### 2. Google Gemini
- **Get an API key**: visit [Google AI Studio](https://makersuite.google.com/app/apikey).
- **Supported models**: Gemini Pro, Gemini Pro Vision.
- **Settings**:
  - API Key: `AIza...`
  - Model: choose an appropriate model

#### 3. Anthropic Claude
- **Get an API key**: visit [Anthropic Console](https://console.anthropic.com/).
- **Supported models**: Claude 3 Sonnet, Claude 3 Opus, Claude 3 Haiku.
- **Settings**:
  - API Key: `sk-ant-...`
  - Model: choose an appropriate model

### Analysis settings

- **Default AI provider**: choose the primary AI service.
- **Analysis depth**:
  - Basic: quickly identifies the primary technologies.
  - Detailed: includes version information and configuration details.
  - Comprehensive: deep analysis that includes performance and security advice.
- **Automatic analysis**: analyzes automatically after the page loads.

## Usage

### Basic use

1. **Open the target website**
   - Open the site to analyze in Chrome.

2. **Start analysis**
   - Select the extension icon in the toolbar.
   - Select **Analyze Current Page**.
   - Wait for analysis to complete.

3. **Review results**
   - Results appear in the popup.
   - They include technology-stack details and an AI analysis summary.

### Advanced features

#### History management
- Select **View History** to open the history page.
- Search, inspect details, and delete records.
- View statistics and usage trends.

#### Data export
- Select the export button on the history page.
- JSON, CSV, and HTML formats are available.
- Exports include complete analysis data and metadata.

#### In-page quick analysis
- A floating analysis button appears at the upper-right of the page.
- Select it to analyze directly in the page.
- Results appear in a modal dialog.

## File structure

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

## Technical architecture

### Core modules

1. **Background Service Worker** (`background.js`)
   - Main extension controller.
   - Handles message communication.
   - Manages the analysis flow.

2. **AI API Manager** (`ai-api-manager.js`)
   - Integrates multiple AI providers.
   - Caches and retries requests.
   - Handles errors.

3. **Local Tech Detector** (`local-tech-detector.js`)
   - Identifies technology stacks locally.
   - Performs pattern-matching detection.
   - Calculates confidence scores.

4. **History Manager** (`history-manager.js`)
   - Stores analysis history.
   - Exports data.
   - Produces statistics.

### Data flow

1. The user starts an analysis request.
2. The Content Script extracts page information.
3. The Local Detector performs local detection.
4. The AI API Manager calls the selected AI service.
5. Local and AI results are merged.
6. The result is saved to history.
7. The user interface displays the result.

## Frequently asked questions

### Q: Why must I configure an AI API?
A: The extension uses AI for deep analysis and needs to call a third-party AI
service. You may select any supported AI provider.

### Q: What if the analysis is inaccurate?
A: Try the following:
- Switch to another AI provider.
- Adjust analysis-depth settings.
- Check that the website has fully loaded.

### Q: How are API keys protected?
A: API keys are stored in Chrome local storage and are not uploaded to any server.
Rotate keys regularly.

### Q: Does the extension collect my data?
A: The extension analyzes page content only locally and does not collect or upload
personal data.

## Development notes

### Development environment
- Chrome browser (version 88+).
- Manifest V3 specification.
- Plain JavaScript; no build tool is required.

### Local development
1. Modify source files.
2. Select **Reload** on the Chrome Extensions page.
3. Test the feature.

### Contributing
Issues and Pull Requests are welcome to improve the extension.

## License

This project uses the MIT License. See LICENSE for details.

## Changelog

### v1.0.0 (2024-12-06)
- 🎉 Initial release
- ✨ Multi-provider AI analysis
- 🔍 Local technology-stack detection
- 📊 History management
- 📤 Data export
- 🎨 Modern user interface

## Contact

For questions or suggestions, contact the project through:
- GitHub Issues: [project URL]
- Email: [contact email]

---

**Tech Stack Analyzer** - making technology-stack analysis simple and efficient.
