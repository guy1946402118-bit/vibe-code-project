// ==UserScript==
// @name         GitNexus 汉化
// @namespace    https://github.com/
// @version      1.0
// @description  为 GitNexus 提供中文界面
// @author       You
// @match        http://localhost:4747/*
// @match        http://localhost:4748/*
// @match        https://gitnexus.vercel.app/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 翻译映射表
    const translations = {
        // 通用
        'GitNexus': 'GitNexus',
        'Loading': '加载中...',
        'Search': '搜索',
        'Home': '首页',
        'Graph': '图谱',
        'Files': '文件',
        'Classes': '类',
        'Functions': '函数',
        'Settings': '设置',
        'About': '关于',
        'Help': '帮助',
        
        // 图谱相关
        'Nodes': '节点',
        'Edges': '边',
        'Zoom': '缩放',
        'Reset': '重置',
        'Layout': '布局',
        'Force': '力导向',
        'Circular': '环形',
        'Hierarchical': '层级',
        'Filter': '筛选',
        'Search nodes': '搜索节点',
        'Click a node for details': '点击节点查看详情',
        
        // 文件相关
        'Directory': '目录',
        'File': '文件',
        'Lines': '行',
        'Size': '大小',
        'Modified': '修改时间',
        
        // 类和函数
        'Class': '类',
        'Function': '函数',
        'Method': '方法',
        'Property': '属性',
        'Parameters': '参数',
        'Return type': '返回类型',
        
        // 分析相关
        'Analyzing': '分析中...',
        'Analyzed': '已分析',
        'Indexing': '索引中...',
        'Indexed': '已索引',
        
        // 统计信息
        'Statistics': '统计',
        'Total files': '文件总数',
        'Total nodes': '节点总数',
        'Total edges': '边总数',
        'Total classes': '类总数',
        'Total functions': '函数总数',
        
        // 按钮和操作
        'Save': '保存',
        'Cancel': '取消',
        'Delete': '删除',
        'Edit': '编辑',
        'Refresh': '刷新',
        'Export': '导出',
        'Import': '导入',
        'Run': '运行',
        'Stop': '停止',
        
        // 错误和提示
        'Error': '错误',
        'Warning': '警告',
        'Success': '成功',
        'Failed': '失败',
        'Loading failed': '加载失败',
        'Try again': '重试',
        
        // 选择器
        'Select': '选择',
        'All': '全部',
        'None': '无',
        'Selected': '已选择',
        
        // 其他
        'Repository': '仓库',
        'Path': '路径',
        'Name': '名称',
        'Type': '类型',
        'Description': '描述',
        'Tags': '标签',
        'Date': '日期',
        'Time': '时间',
        'Language': '语言',
        'Version': '版本',
        'Author': '作者',
        'License': '许可证'
    };

    // 翻译函数
    function translateText(text) {
        if (!text || typeof text !== 'string') return text;
        const trimmed = text.trim();
        if (translations[trimmed]) {
            return translations[trimmed];
        }
        // 尝试部分匹配
        for (const [en, zh] of Object.entries(translations)) {
            if (trimmed.includes(en)) {
                return trimmed.replace(new RegExp(en, 'g'), zh);
            }
        }
        return text;
    }

    // 翻译节点
    function translateNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const newText = translateText(node.textContent);
            if (newText !== node.textContent) {
                node.textContent = newText;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // 跳过一些不需要翻译的元素
            if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE' || 
                node.tagName === 'CODE' || node.tagName === 'PRE') {
                return;
            }
            // 翻译 placeholder 和 value 属性
            if (node.placeholder) {
                node.placeholder = translateText(node.placeholder);
            }
            if (node.value && node.tagName === 'INPUT' && node.type !== 'password') {
                node.value = translateText(node.value);
            }
            // 翻译 aria-label
            if (node.getAttribute && node.getAttribute('aria-label')) {
                node.setAttribute('aria-label', translateText(node.getAttribute('aria-label')));
            }
            // 翻译 title
            if (node.title) {
                node.title = translateText(node.title);
            }
            // 递归处理子节点
            for (const child of node.childNodes) {
                translateNode(child);
            }
        }
    }

    // 主翻译函数
    function translatePage() {
        console.log('[GitNexus 汉化] 开始翻译...');
        translateNode(document.body);
        console.log('[GitNexus 汉化] 翻译完成');
    }

    // 使用 MutationObserver 监听 DOM 变化
    function observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        translateNode(node);
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 初始化
    function init() {
        console.log('[GitNexus 汉化] 脚本已加载');
        
        // 延迟一点时间再翻译，确保页面加载完成
        setTimeout(() => {
            translatePage();
            observeDOM();
        }, 500);
        
        // 也可以在页面完全加载后再次翻译
        window.addEventListener('load', () => {
            setTimeout(translatePage, 1000);
        });
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

