# 🪟 Windows 10 PowerShell 7 安装指南

> **适用系统**：Windows 10 (1903+) | **推荐终端**：PowerShell 7 或 Windows Terminal

---

## 📋 目录

1. [什么是 PowerShell 7？](#什么是-powershell-7)
2. [安装前检查](#安装前检查)
3. [安装方式一：Microsoft Store（推荐⭐）](#安装方式一microsoft-store推荐)
4. [安装方式二：GitHub 下载](#安装方式二github-下载)
5. [安装方式三： winget 命令](#安装方式三-winget-命令)
6. [安装 Node.js 和 Git](#安装-nodejs-和-git)
7. [验证安装](#验证安装)
8. [常见问题解决](#常见问题解决)

---

## 🤔 什么是 PowerShell 7？

| 对比项 | Windows PowerShell 5.1（自带） | PowerShell 7（新版） |
|--------|-------------------------------|---------------------|
| **版本** | 5.1 | 7.x |
| **系统** | Windows 10 自带 | 需单独安装 |
| **命令兼容性** | 旧命令 | 兼容 + 新增命令 |
| **跨平台** | ❌ 仅 Windows | ✅ Windows/Mac/Linux |
| **VSCode/Trae 支持** | 一般 | ✅ 完全支持 |

**为什么需要 PowerShell 7？**
- 四个代码工具的安装命令需要在 `pwsh`（PowerShell 7）环境下运行
- 更好的 UTF-8 支持
- 更好的包管理

---

## 🔍 安装前检查

### 检查当前 PowerShell 版本

打开 PowerShell（或其他终端），运行：

```powershell
$PSVersionTable.PSVersion
```

**结果示例：**
```
Major  Minor  Patch  Label
-----  -----  -----  -----
5      1      22621  NMariatio
```

- **如果是 5.1**：需要安装 PowerShell 7
- **如果是 7.x**：已经安装好了，跳过安装步骤

### 检查系统版本

```powershell
winver
```

**要求**：Windows 10 版本 1903 或更高

---

## 📦 安装方式一：Microsoft Store（推荐⭐）

### 优点
- ✅ 自动更新
- ✅ 安装简单
- ✅ 权限友好

### 步骤

1. **打开 Microsoft Store**
   - 按 `Win` 键，打开开始菜单
   - 搜索 "Microsoft Store"，打开

2. **搜索 PowerShell**
   - 在搜索框输入：`PowerShell`
   - 找到 **"PowerShell (Preview)"** 或 **"PowerShell"**

3. **安装**
   - 点击「安装」按钮
   - 等待下载完成

4. **打开 PowerShell 7**
   - 在开始菜单搜索 `pwsh`
   - 或搜索 `PowerShell 7`

5. **固定到任务栏**（可选）
   - 右键图标 → 「固定到任务栏」

---

## 📦 安装方式二：GitHub 下载

### 适用场景
- Microsoft Store 打不开
- 需要特定版本
- 企业环境限制

### 步骤

1. **访问 GitHub 下载页面**
   ```
   https://github.com/PowerShell/PowerShell/releases
   ```

2. **下载 MSI 安装包**
   - 找到 **Latest release**
   - 找到 **Assets** 展开
   - 下载 `PowerShell-7.x.x-win-x64.msi`（64位系统）

3. **运行安装程序**
   - 双击下载的 `.msi` 文件
   - 如果提示「受保护的文件夹」，点击「仍要运行」
   - 安装向导一路点「Next」即可

4. **安装路径**
   - 默认安装到：`C:\Program Files\PowerShell\7\`
   - 开始菜单会新增「PowerShell 7」

---

## 📦 安装方式三： winget 命令

### winget 是什么？
Windows 官方的包管理工具（类似 Linux 的 apt）

### 步骤

1. **打开 Windows Terminal 或 PowerShell 5.1**
   - 右键开始菜单
   - 选择「Windows Terminal (管理员)」或「PowerShell (管理员)」

2. **运行安装命令**
   ```powershell
   winget install Microsoft.PowerShell
   ```

3. **如果提示 winget 未找到**
   - 先更新 Microsoft Store 的「应用安装程序」
   - 或使用方式一/二安装

4. **查看已安装版本**
   ```powershell
   winget list Microsoft.PowerShell
   ```

---

## 📦 安装 Node.js 和 Git

安装四个代码工具前，需要先安装 Node.js 和 Git

### 安装 Node.js

**方式一：Microsoft Store（推荐）**
1. 打开 Microsoft Store
2. 搜索 `Node.js`
3. 安装 **Node.js LTS** 版本

**方式二：官网下载**
1. 访问：https://nodejs.org/
2. 下载 **LTS** 版本（推荐）
3. 运行安装程序，一路 Next

**验证安装：**
```powershell
node --version
# 应该显示 v18.x.x 或更高
```

### 安装 Git

**方式一：Microsoft Store**
1. 打开 Microsoft Store
2. 搜索 `Git`
3. 安装 **Git**

**方式二：官网下载**
1. 访问：https://git-scm.com/download/win
2. 下载 Windows 版本
3. 运行安装程序

**安装选项（重要）：**
```
✅ 添加 Git 到 PATH
✅ 选择默认分支名为 main
✅ 使用 Windows 默认终端 (MinTTY)
✅ 启用符号链接 (Enable symbolic links)
```

**验证安装：**
```powershell
git --version
# 应该显示 git version 2.x.x
```

---

## ✅ 验证安装

打开 **PowerShell 7**（搜索 `pwsh`），运行以下命令：

```powershell
# 检查 PowerShell 版本
$PSVersionTable.PSVersion

# 检查 Node.js 版本
node --version

# 检查 Git 版本
git --version

# 检查 Python 版本（可能需要安装）
python --version
```

**预期输出：**
```
Major  Minor  Patch  Label
-----  -----  -----  -----
7      4      0

node --version
v20.10.0

git --version
git version 2.43.0
```

---

## 🔧 常见问题解决

### 问题1：PowerShell 执行策略限制

**错误信息：**
```
禁止运行脚本
```

**解决：**
```powershell
# 临时允许运行（当前会话有效）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 或者用管理员权限运行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
```

### 问题2：找不到 pwsh 命令

**原因：** 安装后未刷新环境变量

**解决：**
1. 关闭所有终端窗口
2. 重新打开「PowerShell 7」或「Windows Terminal」
3. 或者重启电脑

### 问题3：npm install 太慢

**解决：使用淘宝镜像**
```powershell
# 设置 npm 镜像
npm config set registry https://registry.npmmirror.com

# 恢复官方镜像
npm config set registry https://registry.npmjs.org
```

### 问题4：PowerShell 7 中文乱码

**解决：**
```powershell
# 设置 UTF-8 编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'

# 永久生效，写入配置文件
if (!(Test-Path $PROFILE)) { New-Item -Path $PROFILE -ItemType File }
Add-Content $PROFILE '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8'
```

### 问题5：权限不足

**解决：以管理员身份运行**
1. 右键「PowerShell 7」
2. 选择「以管理员身份运行」

### 问题6：命令找不到（command not found）

**检查命令是否在 PATH 中：**
```powershell
# 列出所有 PATH 路径
$env:PATH -split ';'

# 手动添加到 PATH（需要管理员权限）
$env:PATH += ";C:\Your\Path\Here"
```

---

## 🚀 快速安装脚本

复制以下内容，保存为 `install-tools.ps1`，右键「以 PowerShell 7 运行」：

```powershell
# PowerShell 7 安装检查和工具安装脚本

Write-Host "=== PowerShell 7 环境检查 ===" -ForegroundColor Cyan

# 1. 检查 PowerShell 版本
if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Host "❌ PowerShell 版本过低，建议升级到 7.x" -ForegroundColor Red
    Write-Host "访问：https://github.com/PowerShell/PowerShell/releases" -ForegroundColor Yellow
} else {
    Write-Host "✅ PowerShell $($PSVersionTable.PSVersion) 已安装" -ForegroundColor Green
}

# 2. 检查 Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion 已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js 未安装" -ForegroundColor Red
    Write-Host "访问：https://nodejs.org/" -ForegroundColor Yellow
}

# 3. 检查 Git
try {
    $gitVersion = git --version
    Write-Host "✅ $gitVersion 已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Git 未安装" -ForegroundColor Red
    Write-Host "访问：https://git-scm.com/" -ForegroundColor Yellow
}

# 4. 检查 Python
try {
    $pythonVersion = python --version
    Write-Host "✅ $pythonVersion 已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Python 未安装（code-review-graph 和 CodeGraphContext 需要）" -ForegroundColor Red
    Write-Host "访问：https://www.python.org/downloads/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== 环境检查完成 ===" -ForegroundColor Cyan
Write-Host "如果有任何 ❌，请先安装对应软件" -ForegroundColor Yellow
```

---

## 📝 安装完成后的下一步

环境安装完成后，可以开始安装四个代码工具：

```powershell
# 1. code-review-graph（代码体检）
pip install code-review-graph

# 2. GitNexus（代码GPS）
npm install -g gitnexus --legacy-peer-deps

# 3. CodeGraphContext（图书馆管理）
pip install code-graph-context

# 4. Understand Anything
# 去 Trae 插件市场搜索安装
```

详细安装说明请查看：[四维代码工具通俗解释.md](./四维代码工具通俗解释.md)

---

## 📚 相关资源

| 资源 | 链接 |
|------|------|
| PowerShell 7 下载 | https://github.com/PowerShell/PowerShell/releases |
| Node.js 下载 | https://nodejs.org/ |
| Git 下载 | https://git-scm.com/ |
| Python 下载 | https://www.python.org/downloads/ |
| winget 使用文档 | https://docs.microsoft.com/windows/package-manager/ |

---

*Windows 10 PowerShell 7 安装指南 - 让你的终端升级到最新版本！*
