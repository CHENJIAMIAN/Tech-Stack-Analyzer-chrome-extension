// 本地技术栈检测模块
class LocalTechDetector {
  constructor() {
    this.patterns = this.initializePatterns();
  }

  // 初始化检测模式
  initializePatterns() {
    return {
      frontend: {
        frameworks: {
          'React': [
            /react/i,
            /_react/i,
            /data-reactroot/i,
            /react-dom/i,
            /__REACT_DEVTOOLS_GLOBAL_HOOK__/i
          ],
          'Vue.js': [
            /vue\.js/i,
            /vue\.min\.js/i,
            /v-if/i,
            /v-for/i,
            /v-model/i,
            /__VUE__/i
          ],
          'Angular': [
            /angular/i,
            /ng-app/i,
            /ng-controller/i,
            /\[ng-/i,
            /_angular_/i
          ],
          'Svelte': [
            /svelte/i,
            /\.svelte/i
          ],
          'Next.js': [
            /_next\//i,
            /next\.js/i,
            /__NEXT_DATA__/i
          ],
          'Nuxt.js': [
            /_nuxt\//i,
            /nuxt\.js/i,
            /__NUXT__/i
          ],
          'Gatsby': [
            /gatsby/i,
            /___gatsby/i
          ]
        },
        libraries: {
          'jQuery': [
            /jquery/i,
            /\$\(/,
            /jQuery/
          ],
          'Lodash': [
            /lodash/i,
            /_\.map/,
            /_\.filter/
          ],
          'Moment.js': [
            /moment\.js/i,
            /moment\(/
          ],
          'D3.js': [
            /d3\.js/i,
            /d3\.min\.js/i,
            /d3\.select/
          ],
          'Three.js': [
            /three\.js/i,
            /three\.min\.js/i
          ],
          'Chart.js': [
            /chart\.js/i,
            /chartjs/i
          ]
        },
        cssFrameworks: {
          'Bootstrap': [
            /bootstrap/i,
            /btn-primary/i,
            /container-fluid/i,
            /col-md-/i
          ],
          'Tailwind CSS': [
            /tailwind/i,
            /tw-/i,
            /bg-blue-/i,
            /text-center/i,
            /flex justify-/i
          ],
          'Bulma': [
            /bulma/i,
            /is-primary/i,
            /column is-/i
          ],
          'Foundation': [
            /foundation/i,
            /grid-x/i,
            /cell large-/i
          ],
          'Semantic UI': [
            /semantic-ui/i,
            /ui button/i,
            /ui menu/i
          ],
          'Material-UI': [
            /material-ui/i,
            /mui-/i,
            /MuiButton/i
          ]
        },
        buildTools: {
          'Webpack': [
            /webpack/i,
            /webpackJsonp/i,
            /__webpack_require__/i
          ],
          'Vite': [
            /vite/i,
            /@vite/i
          ],
          'Parcel': [
            /parcel/i,
            /\.parcel-/i
          ],
          'Rollup': [
            /rollup/i
          ]
        }
      },
      analytics: {
        'Google Analytics': [
          /google-analytics/i,
          /gtag\(/i,
          /ga\(/i,
          /UA-\d+-\d+/,
          /G-[A-Z0-9]+/
        ],
        'Google Tag Manager': [
          /googletagmanager/i,
          /GTM-[A-Z0-9]+/i
        ],
        'Facebook Pixel': [
          /facebook\.net\/tr/i,
          /fbq\(/i
        ],
        'Hotjar': [
          /hotjar/i,
          /hj\(/i
        ],
        'Mixpanel': [
          /mixpanel/i,
          /mixpanel\.track/i
        ]
      },
      cdn: {
        'Cloudflare': [
          /cloudflare/i,
          /cf-ray/i,
          /cdnjs\.cloudflare\.com/i
        ],
        'jsDelivr': [
          /jsdelivr/i,
          /cdn\.jsdelivr\.net/i
        ],
        'unpkg': [
          /unpkg\.com/i
        ],
        'Google Fonts': [
          /fonts\.googleapis\.com/i,
          /fonts\.gstatic\.com/i
        ],
        'Amazon CloudFront': [
          /cloudfront\.net/i
        ]
      },
      hosting: {
        'Vercel': [
          /vercel/i,
          /\.vercel\.app/i
        ],
        'Netlify': [
          /netlify/i,
          /\.netlify\.app/i
        ],
        'GitHub Pages': [
          /github\.io/i
        ],
        'Firebase': [
          /firebase/i,
          /firebaseapp\.com/i
        ]
      },
      backend: {
        'WordPress': [
          /wp-content/i,
          /wp-includes/i,
          /wordpress/i
        ],
        'Drupal': [
          /drupal/i,
          /sites\/default/i
        ],
        'Shopify': [
          /shopify/i,
          /myshopify\.com/i
        ],
        'Wix': [
          /wix\.com/i,
          /wixstatic\.com/i
        ]
      }
    };
  }

  // 检测技术栈
  detect(html, additionalData = {}) {
    const result = {
      frontend: {
        frameworks: [],
        libraries: [],
        cssFrameworks: [],
        buildTools: []
      },
      analytics: [],
      cdn: [],
      hosting: '',
      backend: {
        cms: [],
        platforms: []
      },
      confidence: {},
      detectedElements: {}
    };

    // 检测前端框架
    this.detectCategory(html, this.patterns.frontend.frameworks, result.frontend.frameworks, result);
    
    // 检测JavaScript库
    this.detectCategory(html, this.patterns.frontend.libraries, result.frontend.libraries, result);
    
    // 检测CSS框架
    this.detectCategory(html, this.patterns.frontend.cssFrameworks, result.frontend.cssFrameworks, result);
    
    // 检测构建工具
    this.detectCategory(html, this.patterns.frontend.buildTools, result.frontend.buildTools, result);
    
    // 检测分析工具
    this.detectCategory(html, this.patterns.analytics, result.analytics, result);
    
    // 检测CDN
    this.detectCategory(html, this.patterns.cdn, result.cdn, result);
    
    // 检测后端/CMS
    this.detectCategory(html, this.patterns.backend, result.backend.platforms, result);
    
    // 检测托管服务
    const hostingDetected = this.detectSingle(html, this.patterns.hosting);
    if (hostingDetected) {
      result.hosting = hostingDetected;
    }

    // 添加额外的检测逻辑
    this.enhancedDetection(html, result, additionalData);

    return result;
  }

  // 检测特定类别
  detectCategory(html, patterns, resultArray, fullResult) {
    for (const [tech, regexArray] of Object.entries(patterns)) {
      let matches = 0;
      let totalPatterns = regexArray.length;
      const matchedPatterns = [];

      for (const regex of regexArray) {
        if (regex.test(html)) {
          matches++;
          matchedPatterns.push(regex.toString());
        }
      }

      if (matches > 0) {
        const confidence = matches / totalPatterns;
        resultArray.push(tech);
        fullResult.confidence[tech] = confidence;
        fullResult.detectedElements[tech] = matchedPatterns;
      }
    }
  }

  // 检测单个项目（如托管服务）
  detectSingle(html, patterns) {
    for (const [tech, regexArray] of Object.entries(patterns)) {
      for (const regex of regexArray) {
        if (regex.test(html)) {
          return tech;
        }
      }
    }
    return null;
  }

  // 增强检测
  enhancedDetection(html, result, additionalData) {
    // 检测meta标签
    this.detectMetaTags(html, result);
    
    // 检测脚本源
    this.detectScriptSources(html, result);
    
    // 检测样式表
    this.detectStylesheets(html, result);
    
    // 检测特殊标识符
    this.detectSpecialIdentifiers(html, result);
    
    // 使用额外数据
    if (additionalData.scripts) {
      this.analyzeScripts(additionalData.scripts, result);
    }
    
    if (additionalData.stylesheets) {
      this.analyzeStylesheets(additionalData.stylesheets, result);
    }
  }

  // 检测meta标签
  detectMetaTags(html, result) {
    const metaPatterns = {
      'generator': /content=["']([^"']*generator[^"']*)["']/gi,
      'framework': /content=["']([^"']*framework[^"']*)["']/gi,
      'powered-by': /content=["']([^"']*powered[^"']*)["']/gi
    };

    for (const [type, pattern] of Object.entries(metaPatterns)) {
      const matches = html.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const content = match.match(/content=["']([^"']*)["']/i);
          if (content && content[1]) {
            this.analyzeMetaContent(content[1], result);
          }
        });
      }
    }
  }

  // 分析meta内容
  analyzeMetaContent(content, result) {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('wordpress')) {
      if (!result.backend.platforms.includes('WordPress')) {
        result.backend.platforms.push('WordPress');
      }
    }
    
    if (lowerContent.includes('drupal')) {
      if (!result.backend.platforms.includes('Drupal')) {
        result.backend.platforms.push('Drupal');
      }
    }
    
    if (lowerContent.includes('shopify')) {
      if (!result.backend.platforms.includes('Shopify')) {
        result.backend.platforms.push('Shopify');
      }
    }
  }

  // 检测脚本源
  detectScriptSources(html, result) {
    const scriptRegex = /<script[^>]*src=["']([^"']*)["'][^>]*>/gi;
    const scripts = html.match(scriptRegex) || [];
    
    scripts.forEach(script => {
      const srcMatch = script.match(/src=["']([^"']*)["']/i);
      if (srcMatch && srcMatch[1]) {
        this.analyzeScriptUrl(srcMatch[1], result);
      }
    });
  }

  // 分析脚本URL
  analyzeScriptUrl(url, result) {
    const lowerUrl = url.toLowerCase();
    
    // 检测CDN
    if (lowerUrl.includes('cdnjs.cloudflare.com') && !result.cdn.includes('Cloudflare')) {
      result.cdn.push('Cloudflare');
    }
    
    if (lowerUrl.includes('cdn.jsdelivr.net') && !result.cdn.includes('jsDelivr')) {
      result.cdn.push('jsDelivr');
    }
    
    // 检测库版本
    const versionMatch = url.match(/(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      // 可以记录版本信息
      result.versions = result.versions || {};
      // 这里可以添加版本检测逻辑
    }
  }

  // 检测样式表
  detectStylesheets(html, result) {
    const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*>/gi;
    const links = html.match(linkRegex) || [];
    
    links.forEach(link => {
      const hrefMatch = link.match(/href=["']([^"']*)["']/i);
      if (hrefMatch && hrefMatch[1]) {
        this.analyzeStylesheetUrl(hrefMatch[1], result);
      }
    });
  }

  // 分析样式表URL
  analyzeStylesheetUrl(url, result) {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('bootstrap') && !result.frontend.cssFrameworks.includes('Bootstrap')) {
      result.frontend.cssFrameworks.push('Bootstrap');
    }
    
    if (lowerUrl.includes('tailwind') && !result.frontend.cssFrameworks.includes('Tailwind CSS')) {
      result.frontend.cssFrameworks.push('Tailwind CSS');
    }
    
    if (lowerUrl.includes('fonts.googleapis.com') && !result.cdn.includes('Google Fonts')) {
      result.cdn.push('Google Fonts');
    }
  }

  // 检测特殊标识符
  detectSpecialIdentifiers(html, result) {
    // 检测React特征
    if (html.includes('data-reactroot') || html.includes('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
      if (!result.frontend.frameworks.includes('React')) {
        result.frontend.frameworks.push('React');
        result.confidence['React'] = (result.confidence['React'] || 0) + 0.3;
      }
    }
    
    // 检测Vue特征
    if (html.includes('v-if') || html.includes('v-for') || html.includes('__VUE__')) {
      if (!result.frontend.frameworks.includes('Vue.js')) {
        result.frontend.frameworks.push('Vue.js');
        result.confidence['Vue.js'] = (result.confidence['Vue.js'] || 0) + 0.3;
      }
    }
    
    // 检测Angular特征
    if (html.includes('ng-app') || html.includes('[ng-') || html.includes('_angular_')) {
      if (!result.frontend.frameworks.includes('Angular')) {
        result.frontend.frameworks.push('Angular');
        result.confidence['Angular'] = (result.confidence['Angular'] || 0) + 0.3;
      }
    }
  }

  // 分析脚本数组
  analyzeScripts(scripts, result) {
    scripts.forEach(script => {
      if (script.src) {
        this.analyzeScriptUrl(script.src, result);
      }
      
      if (script.content) {
        // 分析内联脚本内容
        this.analyzeInlineScript(script.content, result);
      }
    });
  }

  // 分析内联脚本
  analyzeInlineScript(content, result) {
    const lowerContent = content.toLowerCase();
    
    // 检测Google Analytics
    if (lowerContent.includes('gtag(') || lowerContent.includes('ga(')) {
      if (!result.analytics.includes('Google Analytics')) {
        result.analytics.push('Google Analytics');
      }
    }
    
    // 检测Facebook Pixel
    if (lowerContent.includes('fbq(')) {
      if (!result.analytics.includes('Facebook Pixel')) {
        result.analytics.push('Facebook Pixel');
      }
    }
  }

  // 分析样式表数组
  analyzeStylesheets(stylesheets, result) {
    stylesheets.forEach(stylesheet => {
      if (stylesheet.href) {
        this.analyzeStylesheetUrl(stylesheet.href, result);
      }
    });
  }

  // 生成检测报告
  generateReport(detectionResult) {
    const report = {
      summary: this.generateSummary(detectionResult),
      details: detectionResult,
      recommendations: this.generateRecommendations(detectionResult)
    };
    
    return report;
  }

  // 生成摘要
  generateSummary(result) {
    const summary = [];
    
    if (result.frontend.frameworks.length > 0) {
      summary.push(`前端框架: ${result.frontend.frameworks.join(', ')}`);
    }
    
    if (result.frontend.cssFrameworks.length > 0) {
      summary.push(`CSS框架: ${result.frontend.cssFrameworks.join(', ')}`);
    }
    
    if (result.backend.platforms.length > 0) {
      summary.push(`后端平台: ${result.backend.platforms.join(', ')}`);
    }
    
    if (result.hosting) {
      summary.push(`托管服务: ${result.hosting}`);
    }
    
    return summary.join('; ');
  }

  // 生成建议
  generateRecommendations(result) {
    const recommendations = [];
    
    // 基于检测结果生成建议
    if (result.frontend.frameworks.length === 0) {
      recommendations.push('考虑使用现代前端框架如React、Vue或Angular来提升开发效率');
    }
    
    if (result.frontend.cssFrameworks.length === 0) {
      recommendations.push('考虑使用CSS框架如Bootstrap或Tailwind CSS来加速UI开发');
    }
    
    if (result.analytics.length === 0) {
      recommendations.push('建议添加网站分析工具如Google Analytics来跟踪用户行为');
    }
    
    return recommendations;
  }
}

export { LocalTechDetector };

