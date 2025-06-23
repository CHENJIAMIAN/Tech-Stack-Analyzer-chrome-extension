# 打包 Chrome 插件为 zip 文件的 PowerShell 脚本
# 使用方法：在项目根目录下右键"使用PowerShell运行"即可

$files = @(
    'manifest.json',
    'popup.html',
    'popup.js',
    'history.html',
    'history.js',
    'history-manager.js',
    'content.js',
    'background.js',
    'ai-api-manager.js',
    'config.js',
    'config.html',
    'local-tech-detector.js',
    'icon-128.png',
    'marked.min.js',
    'purify.min.js'
)

$zipPath = 'Tech-Stack-Analyzer.zip'

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path $files -DestinationPath $zipPath -Force

Write-Host "插件已打包为 $zipPath" 