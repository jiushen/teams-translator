// 全局变量
let config = {
  openaiKey: '',
  deepseekKey: '',
  customTerms: {},
  selectedModel: 'deepseek-v3-0324',
  sourceLang: 'ja',
  targetLang: 'zh',
  clipboardMonitor: true,

  autoCopyResult: false,
  translationPrompt: {
    systemPrompt: '你是专业的翻译助手，提供准确、自然的翻译。',
    userPromptTemplate: '请将以下{sourceLang}文本翻译成{targetLang}：\n\n原文：{text}\n\n要求：\n1. 保持原意准确\n2. 语言自然流畅\n3. 已预处理的专有名词请保持不变\n4. 只返回翻译结果，不要添加任何解释'
  },
  resultStyles: {
    original: {
      fontFamily: 'Consolas, Monaco, monospace',
      fontSize: 14,
      color: '#0056b3',
      fontWeight: 'bold',
      lineHeight: 1.5
    },
    translation: {
      fontFamily: 'Consolas, Monaco, monospace',
      fontSize: 14,
      color: '#28a745',
      fontWeight: 'normal',
      lineHeight: 1.5
    },
    timestamp: {
      fontFamily: 'Consolas, Monaco, monospace',
      fontSize: 12,
      color: '#6c757d',
      fontWeight: 'normal',
      lineHeight: 1.4
    },
    cost: {
      fontFamily: 'Consolas, Monaco, monospace',
      fontSize: 12,
      color: '#fd7e14',
      fontWeight: 'normal',
      lineHeight: 1.4
    },
    clipboard: {
      fontFamily: 'Consolas, Monaco, monospace',
      fontSize: 13,
      color: '#6f42c1',
      fontWeight: 'normal',
      fontStyle: 'italic',
      lineHeight: 1.4
    },
    error: {
      fontFamily: 'Consolas, Monaco, monospace',
      fontSize: 12,
      color: '#dc3545',
      fontWeight: 'normal',
      lineHeight: 1.4
    },
    info: {
      fontFamily: 'Consolas, Monaco, monospace',
      fontSize: 12,
      color: '#17a2b8',
      fontWeight: 'normal',
      lineHeight: 1.4
    }
  }
};

let totalInputTokens = 0;
let totalOutputTokens = 0;
let estimatedCost = 0;
let lastProcessedClipboard = '';
let isTranslating = false;

// AI模型配置
const aiModels = {
  "deepseek-v3-0324": {
    name: "DeepSeek V3-0324 🔥",
    inputPrice: 0.27,
    outputPrice: 1.10,
    description: "DeepSeek V3-0324最新版本，翻译质量卓越",
    provider: "deepseek",
    apiModel: "deepseek-chat"
  },
  "deepseek-r1-0528": {
    name: "DeepSeek R1-0528 🚀",
    inputPrice: 0.55,
    outputPrice: 2.19,
    description: "DeepSeek R1-0528推理模型，逻辑思维能力强",
    provider: "deepseek",
    apiModel: "deepseek-reasoner"
  },
  "gpt-4o-mini": {
    name: "GPT-4o Mini",
    inputPrice: 0.15,
    outputPrice: 0.60,
    description: "OpenAI性价比最高，适合大量翻译",
    provider: "openai"
  },
  "gpt-4o": {
    name: "GPT-4o (最新)",
    inputPrice: 5.00,
    outputPrice: 15.00,
    description: "OpenAI最新最强模型，翻译质量最佳",
    provider: "openai"
  },
  "gpt-3.5-turbo": {
    name: "GPT-3.5 Turbo",
    inputPrice: 0.50,
    outputPrice: 1.50,
    description: "OpenAI最便宜选项，基础翻译够用",
    provider: "openai"
  }
};

// 初始化
window.addEventListener('DOMContentLoaded', async () => {
  // 加载配置
  const result = await window.electronAPI.loadConfig();
  if (result.success) {
    Object.assign(config, result.config);
    applyConfig();
  }

  // 设置事件监听
  setupEventListeners();
  
  // 更新模型信息
  updateModelInfo();
  updateCurrentModelDisplay();
  
  // 初始化折叠状态
  initializeCollapseState();

  // 默认启用剪贴板监听
  document.getElementById('clipboardMonitor').checked = config.clipboardMonitor;
  
  // 如果配置了剪贴板监听，自动启动
  if (config.clipboardMonitor) {
    setTimeout(() => {
      startClipboardMonitor();
    }, 1000);
  }

  // 更新术语数量显示
  updateTermsCount();
});

// 标签页切换功能
function switchTab(tabName) {
  // 隐藏所有标签页内容
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    content.classList.remove('active');
  });

  // 移除所有标签按钮的active状态
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.classList.remove('active');
  });

  // 显示选中的标签页
  document.getElementById(tabName + 'Tab').classList.add('active');
  
  // 激活对应的标签按钮
  const activeButton = Array.from(tabButtons).find(button => 
    button.textContent.includes(getTabDisplayName(tabName))
  );
  if (activeButton) {
    activeButton.classList.add('active');
  }

  // 根据标签页执行特定操作
  if (tabName === 'history') {
    loadHistory();
    loadStatistics();
  } else if (tabName === 'config') {
    updateTermsCount();
  }
}

function getTabDisplayName(tabName) {
  const names = {
    'translate': '翻译',
    'config': '配置', 
    'history': '历史'
  };
  return names[tabName] || tabName;
}

// 更新当前模型显示
function updateCurrentModelDisplay() {
  const modelKey = config.selectedModel || document.getElementById('modelSelect').value;
  const modelName = aiModels[modelKey]?.name || modelKey;
  const displayElement = document.getElementById('currentModelDisplay');
  if (displayElement) {
    displayElement.textContent = modelName;
  }
}

// 设置事件监听
function setupEventListeners() {
  // 剪贴板变化事件
  window.electronAPI.onClipboardChanged(async (text) => {
    if (config.clipboardMonitor) {
      await handleClipboardContent(text);
    }
  });

  // 菜单事件
  window.electronAPI.onShowGuide(() => {
    showGuide();
  });

  window.electronAPI.onShowModelComparison(() => {
    showModelComparison();
  });

  window.electronAPI.onLoadConfig((config) => {
    Object.assign(config, config);
    applyConfig();
    appendResult('📥 配置已导入', 'timestamp');
  });

  window.electronAPI.onRequestConfigExport(() => {
    saveConfig();
    window.electronAPI.exportConfig(config);
  });
}

// 应用配置
function applyConfig() {
  document.getElementById('openaiKey').value = config.openaiKey || '';
  document.getElementById('deepseekKey').value = config.deepseekKey || '';
  document.getElementById('modelSelect').value = config.selectedModel;
  document.getElementById('sourceLang').value = config.sourceLang;
  document.getElementById('targetLang').value = config.targetLang;
  document.getElementById('clipboardMonitor').checked = config.clipboardMonitor;

  document.getElementById('autoCopyResult').checked = config.autoCopyResult;
  
  // 加载prompt配置
  if (config.translationPrompt) {
    const systemPromptEl = document.getElementById('systemPrompt');
    const userPromptTemplateEl = document.getElementById('userPromptTemplate');
    if (systemPromptEl) systemPromptEl.value = config.translationPrompt.systemPrompt;
    if (userPromptTemplateEl) userPromptTemplateEl.value = config.translationPrompt.userPromptTemplate;
  }
  
  updateCurrentModelDisplay();
  
  // 加载样式设置
  if (config.resultStyles) {
    loadStyleSettings();
  }
}

// 保存配置
async function saveConfig() {
  config.openaiKey = document.getElementById('openaiKey').value;
  config.deepseekKey = document.getElementById('deepseekKey').value;
  config.selectedModel = document.getElementById('modelSelect').value;
  config.sourceLang = document.getElementById('sourceLang').value;
  config.targetLang = document.getElementById('targetLang').value;
  config.clipboardMonitor = document.getElementById('clipboardMonitor').checked;

  config.autoCopyResult = document.getElementById('autoCopyResult').checked;

  // 保存prompt配置
  const systemPromptEl = document.getElementById('systemPrompt');
  const userPromptTemplateEl = document.getElementById('userPromptTemplate');
  if (systemPromptEl && userPromptTemplateEl) {
    config.translationPrompt = {
      systemPrompt: systemPromptEl.value,
      userPromptTemplate: userPromptTemplateEl.value
    };
  }

  await window.electronAPI.saveConfig(config);
  updateCurrentModelDisplay();
}

// 切换密钥可见性
function toggleKeyVisibility(inputId) {
  const input = document.getElementById(inputId);
  const button = input.nextElementSibling;
  
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '隐藏';
  } else {
    input.type = 'password';
    button.textContent = '显示';
  }
}

// 更新模型信息
function updateModelInfo() {
  const modelKey = document.getElementById('modelSelect').value;
  const model = aiModels[modelKey];
  const infoDiv = document.getElementById('modelInfo');
  
  if (infoDiv) {
    infoDiv.innerHTML = `
      <strong>${model.name}</strong> | 
      输入: $${model.inputPrice}/1M tokens | 
      输出: $${model.outputPrice}/1M tokens | 
      ${model.description}
    `;
  }
  
  saveConfig();
}

// 文本输入折叠功能
function toggleInputSection() {
  const content = document.getElementById('inputContent');
  const icon = document.getElementById('inputCollapseIcon');
  
  if (content.classList.contains('collapsed')) {
    content.classList.remove('collapsed');
    icon.classList.remove('collapsed');
    icon.textContent = '▼';
  } else {
    content.classList.add('collapsed');
    icon.classList.add('collapsed');
    icon.textContent = '▶';
  }
}

// 初始化折叠状态
function initializeCollapseState() {
  const content = document.getElementById('inputContent');
  const icon = document.getElementById('inputCollapseIcon');
  
  // 默认折叠
  content.classList.add('collapsed');
  icon.classList.add('collapsed');
  icon.textContent = '▶';
}

// 切换语言
function swapLanguages() {
  const sourceLang = document.getElementById('sourceLang');
  const targetLang = document.getElementById('targetLang');
  
  if (sourceLang.value === 'auto') {
    alert('源语言为自动检测时无法切换');
    return;
  }
  
  const temp = sourceLang.value;
  sourceLang.value = targetLang.value;
  targetLang.value = temp;
  
  saveConfig();
  appendResult(`🔄 语言已切换: ${getLanguageName(sourceLang.value)} → ${getLanguageName(targetLang.value)}`, 'timestamp');
}

// 获取语言名称
function getLanguageName(code) {
  const names = {
    'ja': '日语',
    'zh': '中文',
    'en': '英语',
    'auto': '自动检测'
  };
  return names[code] || code;
}



// 剪贴板监听控制
async function toggleClipboardMonitor() {
  const isEnabled = document.getElementById('clipboardMonitor').checked;
  
  if (isEnabled) {
    await startClipboardMonitor();
  } else {
    await stopClipboardMonitor();
  }
  
  saveConfig();
}

async function startClipboardMonitor() {
  try {
    const result = await window.electronAPI.startClipboardWatch();
    if (result) {
      updateStatus('剪贴板监听已启动');
      appendResult('🎯 剪贴板监听已启动 - 复制文本将自动翻译', 'clipboard');
    }
  } catch (error) {
    console.error('启动剪贴板监听失败:', error);
    document.getElementById('clipboardMonitor').checked = false;
    alert('启动剪贴板监听失败，请检查配置');
  }
}

async function stopClipboardMonitor() {
  try {
    await window.electronAPI.stopClipboardWatch();
    updateStatus('剪贴板监听已停止');
    appendResult('🛑 剪贴板监听已停止', 'clipboard');
  } catch (error) {
    console.error('停止剪贴板监听失败:', error);
  }
}

async function handleClipboardContent(text) {
  if (!text || text.trim().length < 2) return;
  
  // 防止重复翻译同一内容
  if (text === lastProcessedClipboard) {
    console.log('跳过重复的剪贴板内容:', text.substring(0, 50));
    return;
  }
  
  // 防止正在翻译时再次触发
  if (isTranslating) {
    console.log('正在翻译中，跳过新的剪贴板内容');
    return;
  }
  
  // 检查是否是刚刚翻译生成的结果（避免循环翻译）
  const detectedLang = detectLanguage(text);
  if (detectedLang === config.targetLang) {
    console.log('检测到目标语言，可能是翻译结果，跳过');
    lastProcessedClipboard = text;
    return;
  }
  
  try {
    isTranslating = true;
    lastProcessedClipboard = text;
    
    const timestamp = new Date().toLocaleTimeString();
    
    appendResult(`[${timestamp}] 📋 检测到剪贴板内容`, 'clipboard');
    
    const translation = await performTranslation(text, detectedLang);
    
    if (translation) {
      const modelName = aiModels[config.selectedModel].name;
      appendResult(`🎯 自动翻译完成 (${modelName})`, 'timestamp');
      appendResult(`原文 (${detectedLang}): ${text}`, 'original');
      
      appendResult(`译文 (${config.targetLang}): ${translation.text}`, 'translation');
      
      if (translation.usage) {
        updateCostInfo(translation.usage);
      }
      
      // 自动复制结果
      if (config.autoCopyResult) {
        // 延迟复制，确保当前翻译处理完成
        setTimeout(async () => {
          await window.electronAPI.setClipboardText(translation.text);
          appendResult('📋 翻译结果已复制到剪贴板', 'clipboard');
        }, 100);
      }
      
      appendResult('=' + '='.repeat(50), 'timestamp');
    }
  } catch (error) {
    appendResult(`❌ 自动翻译失败: ${error.message}`, 'timestamp');
  } finally {
    // 延迟重置翻译状态，防止快速连续触发
    setTimeout(() => {
      isTranslating = false;
    }, 1000);
  }
}

// 语言检测
function detectLanguage(text) {
  if (config.sourceLang !== 'auto') {
    return config.sourceLang;
  }
  
  // 简单的语言检测逻辑
  const hiraganaKatakana = text.match(/[\u3040-\u309F\u30A0-\u30FF]/g);
  const chineseChars = text.match(/[\u4E00-\u9FFF]/g);
  const englishChars = text.match(/[a-zA-Z]/g);
  
  if (hiraganaKatakana && hiraganaKatakana.length > 0) {
    return 'ja';
  } else if (chineseChars && chineseChars.length > englishChars?.length) {
    return 'zh';
  } else if (englishChars && englishChars.length > 0) {
    return 'en';
  }
  
  return 'unknown';
}

// 翻译文本
async function translateText() {
  const text = document.getElementById('inputText').value.trim();
  
  if (!text) {
    alert('请输入要翻译的文本');
    return;
  }
  
  try {
    updateStatus('正在翻译...');
    
    // 检查是否需要清空结果
    const resultMode = document.querySelector('input[name="resultMode"]:checked').value;
    if (resultMode === 'clear') {
      clearResults();
    }
    
    const detectedLang = detectLanguage(text);
    const translation = await performTranslation(text, detectedLang);
    
    if (translation) {
      const timestamp = new Date().toLocaleTimeString();
      const modelName = aiModels[document.getElementById('modelSelect').value].name;
      
      appendResult(`[${timestamp}] 🎯 翻译完成 (${modelName})`, 'timestamp');
      appendResult(`原文 (${detectedLang}): ${text}`, 'original');
      
      appendResult(`译文 (${document.getElementById('targetLang').value}): ${translation.text}`, 'translation');
      
      // 显示成本
      if (translation.usage) {
        updateCostInfo(translation.usage);
      }
      
      appendResult('=' + '='.repeat(50), 'timestamp');
      
      updateStatus('翻译完成');
    }
  } catch (error) {
    alert(`翻译失败: ${error.message}`);
    updateStatus('翻译失败');
  }
}

// 执行翻译
async function performTranslation(text, sourceLang) {
  const modelKey = document.getElementById('modelSelect').value;
  const model = aiModels[modelKey];
  const targetLang = document.getElementById('targetLang').value;
  
  // 预处理术语
  let processedText = text;
  const replacements = [];
  
  for (const [term, translation] of Object.entries(config.customTerms)) {
    if (processedText.includes(term)) {
      processedText = processedText.replace(new RegExp(term, 'g'), translation);
      replacements.push(`${term} → ${translation}`);
    }
  }
  
  if (replacements.length > 0) {
    appendResult(`📚 术语预处理: ${replacements.join(', ')}`, 'timestamp');
  }
  
  // 准备翻译选项
  const translationOptions = {
    text: processedText,
    sourceLang: sourceLang,
    targetLang: targetLang,
    modelKey: modelKey,
    customTerms: config.customTerms,
    translationPrompt: config.translationPrompt,
    openaiKey: document.getElementById('openaiKey').value,
    deepseekKey: document.getElementById('deepseekKey').value
  };
  
  // 调用后端翻译服务
  const result = await window.electronAPI.translate(translationOptions);
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return {
    text: result.result.translatedText,
    usage: result.result.usage
  };
}

// 批量翻译
async function batchTranslate() {
  const text = document.getElementById('inputText').value.trim();
  
  if (!text) {
    alert('请输入要翻译的文本');
    return;
  }
  
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length <= 1) {
    await translateText();
    return;
  }
  
  if (!confirm(`将翻译 ${lines.length} 行文本，可能产生较高费用。是否继续？`)) {
    return;
  }
  
  try {
    updateStatus(`正在批量翻译 ${lines.length} 行文本...`);
    
    const resultMode = document.querySelector('input[name="resultMode"]:checked').value;
    if (resultMode === 'clear') {
      clearResults();
    }
    
    appendResult(`🚀 开始批量翻译 ${lines.length} 行文本...`, 'timestamp');
    
    let totalCost = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const detectedLang = detectLanguage(line);
      
      try {
        const translation = await performTranslation(line, detectedLang);
        
        if (translation) {
          appendResult(`[${i + 1}/${lines.length}] ${line} → ${translation.text}`, 'translation');
          
          if (translation.usage) {
            const cost = calculateCost(translation.usage, document.getElementById('modelSelect').value);
            totalCost += cost;
          }
        }
        
        // 避免API限制
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        appendResult(`[${i + 1}/${lines.length}] 翻译失败: ${error.message}`, 'timestamp');
      }
    }
    
    appendResult(`✅ 批量翻译完成，本次总成本: $${totalCost.toFixed(4)}`, 'cost');
    updateStatus('批量翻译完成');
  } catch (error) {
    alert(`批量翻译失败: ${error.message}`);
    updateStatus('批量翻译失败');
  }
}

// 粘贴并翻译
async function pasteAndTranslate() {
  try {
    const text = await window.electronAPI.getClipboardText();
    
    if (text.trim()) {
      document.getElementById('inputText').value = text;
      await translateText();
    } else {
      alert('剪贴板为空');
    }
  } catch (error) {
    alert(`粘贴失败: ${error.message}`);
  }
}

// 清空输入
function clearInput() {
  document.getElementById('inputText').value = '';
}

// 清空结果
function clearResults() {
  document.getElementById('resultText').innerHTML = '';
}

// 复制结果
async function copyResults() {
  const resultDiv = document.getElementById('resultText');
  const text = resultDiv.innerText;
  
  if (text.trim()) {
    await window.electronAPI.setClipboardText(text);
    alert('翻译结果已复制到剪贴板');
  } else {
    alert('没有可复制的内容');
  }
}

// 添加结果
function appendResult(text, className) {
  const resultDiv = document.getElementById('resultText');
  const p = document.createElement('p');
  
  // 映射旧的类名到新的类名
  const classMap = {
    'original': 'original-text',
    'translation': 'translation-text',
    'timestamp': 'timestamp-text',
    'cost': 'cost-text',
    'clipboard': 'clipboard-text',
    'error': 'error-text',
    'info': 'info-text'
  };
  
  p.className = classMap[className] || className || '';
  p.textContent = text;
  // 设置CSS样式以支持换行符显示
  p.style.whiteSpace = 'pre-wrap';
  resultDiv.appendChild(p);
  resultDiv.scrollTop = resultDiv.scrollHeight;
}

// 更新状态
function updateStatus(text) {
  document.getElementById('statusBar').textContent = text;
}

// 计算成本
function calculateCost(usage, modelKey) {
  const model = aiModels[modelKey];
  const inputCost = (usage.prompt_tokens / 1000000) * model.inputPrice;
  const outputCost = (usage.completion_tokens / 1000000) * model.outputPrice;
  return inputCost + outputCost;
}

// 更新成本信息
function updateCostInfo(usage) {
  const modelKey = document.getElementById('modelSelect').value;
  const cost = calculateCost(usage, modelKey);
  
  totalInputTokens += usage.prompt_tokens || 0;
  totalOutputTokens += usage.completion_tokens || 0;
  estimatedCost += cost;
  
  document.getElementById('costInfo').textContent = `本次会话成本: $${estimatedCost.toFixed(4)}`;
  
  const costText = `本次成本: $${cost.toFixed(4)} (输入:${usage.prompt_tokens} 输出:${usage.completion_tokens} tokens)`;
  appendResult(costText, 'cost');
}

// 重置成本
function resetCost() {
  totalInputTokens = 0;
  totalOutputTokens = 0;
  estimatedCost = 0;
  document.getElementById('costInfo').textContent = '本次会话成本: $0.00';
  appendResult('📊 成本统计已重置', 'timestamp');
}

// 术语词典相关功能
function openTermsEditor() {
  const modal = document.getElementById('termsModal');
  modal.style.display = 'block';
  loadTermsList();
}

function closeTermsModal() {
  document.getElementById('termsModal').style.display = 'none';
}

function loadTermsList() {
  const listDiv = document.getElementById('termsList');
  listDiv.innerHTML = '';
  
  if (Object.keys(config.customTerms).length === 0) {
    listDiv.innerHTML = '<p class="no-data">暂无自定义术语</p>';
    return;
  }
  
  for (const [japanese, translation] of Object.entries(config.customTerms)) {
    const item = document.createElement('div');
    item.className = 'term-item';
    item.innerHTML = `
      <div>
        <strong>${japanese}</strong> → ${translation}
      </div>
      <button onclick="deleteTerm('${japanese}')" style="background-color: #e74c3c;">删除</button>
    `;
    listDiv.appendChild(item);
  }
}

function addTerm() {
  const japanese = document.getElementById('japaneseTermInput').value.trim();
  const translation = document.getElementById('translationTermInput').value.trim();
  
  if (!japanese || !translation) {
    alert('请输入日语原文和正确翻译');
    return;
  }
  
  config.customTerms[japanese] = translation;
  
  // 清空输入框
  document.getElementById('japaneseTermInput').value = '';
  document.getElementById('translationTermInput').value = '';
  
  loadTermsList();
  updateTermsCount();
  saveConfig();
}

function deleteTerm(japanese) {
  if (confirm(`确定要删除术语 "${japanese}" 吗？`)) {
    delete config.customTerms[japanese];
    loadTermsList();
    updateTermsCount();
    saveConfig();
  }
}

function importPresetTerms() {
  const presets = {
    "アーバンも": "Avamo",
    "アバモ": "Avamo",
    "エアテレント": "AI Talent",
    "ホリプロ": "Horipro",
    "クリエイティブチェック": "创意审核",
    "アバター": "虚拟形象",
    "タレント": "艺人",
    "ネイティブチェック": "母语审核",
    "アイドル": "偶像",
    "アニメキャラ": "动画角色"
  };
  
  let addedCount = 0;
  for (const [japanese, translation] of Object.entries(presets)) {
    if (!config.customTerms[japanese]) {
      config.customTerms[japanese] = translation;
      addedCount++;
    }
  }
  
  if (addedCount > 0) {
    loadTermsList();
    updateTermsCount();
    saveConfig();
    alert(`已导入 ${addedCount} 个预设术语`);
  } else {
    alert('预设术语已全部存在');
  }
}

function saveTerms() {
  saveConfig();
  updateTermsCount();
  alert('术语词典已保存');
  closeTermsModal();
}

// 更新术语数量显示
function updateTermsCount() {
  const count = Object.keys(config.customTerms).length;
  const countElement = document.getElementById('termsCount');
  if (countElement) {
    countElement.textContent = `当前术语数量: ${count}`;
  }
}

// 历史记录功能
async function loadHistory() {
  try {
    const result = await window.electronAPI.getTranslationHistory(50, 0);
    const historyDiv = document.getElementById('historyList');
    
    if (result.success && result.history.length > 0) {
      historyDiv.innerHTML = '';
      result.history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
          <div class="history-time">${new Date(item.timestamp).toLocaleString()}</div>
          <div class="history-text">
            <div class="history-original">原文: ${item.originalText}</div>
            <div class="history-translation">译文: ${item.translatedText}</div>
          </div>
        `;
        historyDiv.appendChild(historyItem);
      });
    } else {
      historyDiv.innerHTML = '<p class="no-data">暂无翻译历史</p>';
    }
  } catch (error) {
    console.error('加载历史失败:', error);
  }
}

async function clearHistory() {
  if (confirm('确定要清空所有翻译历史吗？此操作不可恢复。')) {
    try {
      await window.electronAPI.clearTranslationHistory();
      loadHistory();
      alert('翻译历史已清空');
    } catch (error) {
      alert('清空历史失败');
    }
  }
}

async function exportHistoryData() {
  try {
    // 这里需要用户选择导出路径，简化实现
    alert('历史导出功能需要选择保存路径，请使用菜单中的导出功能');
  } catch (error) {
    alert('导出历史失败');
  }
}

// 统计信息
async function loadStatistics() {
  try {
    const result = await window.electronAPI.getStatistics();
    const statsDiv = document.getElementById('statsInfo');
    
    if (result.success) {
      const stats = result.stats;
      statsDiv.innerHTML = `
        <div class="stat-card">
          <div class="stat-title">总翻译次数</div>
          <div class="stat-value">${stats.totalTranslations || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">总消耗 Tokens</div>
          <div class="stat-value">${stats.totalTokens || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">总成本</div>
          <div class="stat-value">$${(stats.totalCost || 0).toFixed(4)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">今日翻译</div>
          <div class="stat-value">${stats.todayTranslations || 0}</div>
        </div>
      `;
    } else {
      statsDiv.innerHTML = '<p class="no-data">统计信息加载失败</p>';
    }
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

// 数据管理功能
async function exportConfig() {
  try {
    await saveConfig();
    alert('配置导出功能请使用菜单：文件 → 导出配置');
  } catch (error) {
    alert('导出配置失败');
  }
}

async function importConfig() {
  alert('配置导入功能请使用菜单：文件 → 导入配置');
}

async function backupData() {
  try {
    // 这里需要用户选择备份路径，简化实现
    alert('数据备份功能需要选择保存路径，请联系开发者实现完整功能');
  } catch (error) {
    alert('数据备份失败');
  }
}

async function restoreData() {
  try {
    // 这里需要用户选择恢复文件，简化实现
    alert('数据恢复功能需要选择备份文件，请联系开发者实现完整功能');
  } catch (error) {
    alert('数据恢复失败');
  }
}

// 使用说明
function showGuide() {
  alert(`Teams翻译助手 v2.1 使用说明

📋 主要功能：
• 剪贴板监听翻译 - 复制文本自动翻译
• 多种AI模型支持 - DeepSeek、OpenAI
• 自定义术语词典 - 提高翻译准确性
• 翻译历史记录 - 查看使用统计

🔧 使用方法：
1. 在"配置"标签页设置API Key
2. 选择合适的AI模型
3. 启用剪贴板监听或手动输入翻译
4. 在"历史"标签页查看翻译记录

💡 提示：建议使用DeepSeek模型，性价比最高！`);
}

// 模型对比
function showModelComparison() {
  alert(`AI模型对比

🔥 推荐模型：
• DeepSeek V3-0324 - 性价比最高
• DeepSeek R1-0528 - 推理能力强
• GPT-4o Mini - OpenAI性价比选择

💰 成本对比（1000字翻译）：
• DeepSeek V3-0324: ~$0.005
• DeepSeek R1-0528: ~$0.01  
• GPT-4o Mini: ~$0.01
• GPT-4o: ~$0.08

🎯 使用建议：
日常翻译首选DeepSeek V3-0324
重要翻译可用GPT-4o`);
}

// 样式管理功能
function loadStyleSettings() {
  if (!config.resultStyles) return;
  
  const styles = config.resultStyles;
  
  // 加载原文样式
  const originalFontFamily = document.getElementById('originalFontFamily');
  const originalFontSize = document.getElementById('originalFontSize');
  const originalColor = document.getElementById('originalColor');
  const originalFontWeight = document.getElementById('originalFontWeight');
  
  if (originalFontFamily) originalFontFamily.value = styles.original.fontFamily;
  if (originalFontSize) originalFontSize.value = styles.original.fontSize;
  if (originalColor) originalColor.value = styles.original.color;
  if (originalFontWeight) originalFontWeight.value = styles.original.fontWeight;
  
  // 加载译文样式
  const translationFontFamily = document.getElementById('translationFontFamily');
  const translationFontSize = document.getElementById('translationFontSize');
  const translationColor = document.getElementById('translationColor');
  const translationFontWeight = document.getElementById('translationFontWeight');
  
  if (translationFontFamily) translationFontFamily.value = styles.translation.fontFamily;
  if (translationFontSize) translationFontSize.value = styles.translation.fontSize;
  if (translationColor) translationColor.value = styles.translation.color;
  if (translationFontWeight) translationFontWeight.value = styles.translation.fontWeight;
  
  // 加载时间戳样式
  const timestampFontFamily = document.getElementById('timestampFontFamily');
  const timestampFontSize = document.getElementById('timestampFontSize');
  const timestampColor = document.getElementById('timestampColor');
  
  if (timestampFontFamily) timestampFontFamily.value = styles.timestamp.fontFamily;
  if (timestampFontSize) timestampFontSize.value = styles.timestamp.fontSize;
  if (timestampColor) timestampColor.value = styles.timestamp.color;
  
  // 应用样式到预览和结果区域
  applyStylesToElements();
}

function updateResultStyles() {
  if (!config.resultStyles) {
    config.resultStyles = {
      original: {},
      translation: {},
      timestamp: {},
      cost: {},
      clipboard: {}
    };
  }
  
  // 更新原文样式
  const originalFontFamily = document.getElementById('originalFontFamily');
  const originalFontSize = document.getElementById('originalFontSize');
  const originalColor = document.getElementById('originalColor');
  const originalFontWeight = document.getElementById('originalFontWeight');
  
  if (originalFontFamily) config.resultStyles.original.fontFamily = originalFontFamily.value;
  if (originalFontSize) config.resultStyles.original.fontSize = originalFontSize.value + 'px';
  if (originalColor) config.resultStyles.original.color = originalColor.value;
  if (originalFontWeight) config.resultStyles.original.fontWeight = originalFontWeight.value;
  
  // 更新译文样式
  const translationFontFamily = document.getElementById('translationFontFamily');
  const translationFontSize = document.getElementById('translationFontSize');
  const translationColor = document.getElementById('translationColor');
  const translationFontWeight = document.getElementById('translationFontWeight');
  
  if (translationFontFamily) config.resultStyles.translation.fontFamily = translationFontFamily.value;
  if (translationFontSize) config.resultStyles.translation.fontSize = translationFontSize.value + 'px';
  if (translationColor) config.resultStyles.translation.color = translationColor.value;
  if (translationFontWeight) config.resultStyles.translation.fontWeight = translationFontWeight.value;
  
  // 更新时间戳样式
  const timestampFontFamily = document.getElementById('timestampFontFamily');
  const timestampFontSize = document.getElementById('timestampFontSize');
  const timestampColor = document.getElementById('timestampColor');
  
  if (timestampFontFamily) config.resultStyles.timestamp.fontFamily = timestampFontFamily.value;
  if (timestampFontSize) config.resultStyles.timestamp.fontSize = timestampFontSize.value + 'px';
  if (timestampColor) config.resultStyles.timestamp.color = timestampColor.value;
  
  // 成本和剪贴板样式继承时间戳样式
  config.resultStyles.cost = { ...config.resultStyles.timestamp };
  config.resultStyles.clipboard = { ...config.resultStyles.timestamp };
  
  // 应用样式
  applyStylesToElements();
  
  // 保存配置
  saveStyles();
}

function applyStylesToElements() {
  if (!config.resultStyles) return;
  
  const styles = config.resultStyles;
  
  // 创建或更新样式表
  let styleSheet = document.getElementById('dynamicStyles');
  if (!styleSheet) {
    styleSheet = document.createElement('style');
    styleSheet.id = 'dynamicStyles';
    document.head.appendChild(styleSheet);
  }
  
  const css = `
    .original-text {
      font-family: ${styles.original.fontFamily || 'Arial'} !important;
      font-size: ${styles.original.fontSize || '14px'} !important;
      color: ${styles.original.color || '#0066cc'} !important;
      font-weight: ${styles.original.fontWeight || 'bold'} !important;
      line-height: 1.4 !important;
    }
    
    .translation-text {
      font-family: ${styles.translation.fontFamily || 'Arial'} !important;
      font-size: ${styles.translation.fontSize || '14px'} !important;
      color: ${styles.translation.color || '#009900'} !important;
      font-weight: ${styles.translation.fontWeight || 'normal'} !important;
      line-height: 1.4 !important;
    }
    
    .timestamp-text, .cost-text, .clipboard-text {
      font-family: ${styles.timestamp.fontFamily || 'Arial'} !important;
      font-size: ${styles.timestamp.fontSize || '12px'} !important;
      color: ${styles.timestamp.color || '#666666'} !important;
      line-height: 1.3 !important;
    }
    
    .cost-text {
      color: ${styles.cost?.color || '#ff8800'} !important;
    }
    
    .clipboard-text {
      color: ${styles.clipboard?.color || '#9966cc'} !important;
    }
    
    /* 预览样式 */
    .style-preview .preview-original {
      font-family: ${styles.original.fontFamily || 'Arial'};
      font-size: ${styles.original.fontSize || '14px'};
      color: ${styles.original.color || '#0066cc'};
      font-weight: ${styles.original.fontWeight || 'bold'};
      margin: 5px 0;
    }
    
    .style-preview .preview-translation {
      font-family: ${styles.translation.fontFamily || 'Arial'};
      font-size: ${styles.translation.fontSize || '14px'};
      color: ${styles.translation.color || '#009900'};
      font-weight: ${styles.translation.fontWeight || 'normal'};
      margin: 5px 0;
    }
    
    .style-preview .preview-timestamp {
      font-family: ${styles.timestamp.fontFamily || 'Arial'};
      font-size: ${styles.timestamp.fontSize || '12px'};
      color: ${styles.timestamp.color || '#666666'};
      margin: 5px 0;
    }
  `;
  
  styleSheet.textContent = css;
}

function resetDefaultStyles() {
  // 重置为默认样式
  config.resultStyles = {
    original: {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#0066cc',
      fontWeight: 'bold'
    },
    translation: {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#009900',
      fontWeight: 'normal'
    },
    timestamp: {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#666666'
    },
    cost: {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ff8800'
    },
    clipboard: {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#9966cc'
    }
  };
  
  // 重新加载设置到界面
  loadStyleSettings();
  
  // 应用样式
  applyStylesToElements();
  
  // 保存配置
  saveStyles();
  
  alert('已恢复默认样式设置');
}

function saveStyles() {
  // 保存配置到文件
  window.electronAPI.saveConfig(config);
}

// 在加载配置后调用样式加载
function loadConfigAndStyles() {
  loadConfig();
  setTimeout(() => {
    loadStyleSettings();
  }, 100);
}

// 修改原有的loadConfig调用
document.addEventListener('DOMContentLoaded', function() {
  loadConfigAndStyles();
  
  // 为所有样式控件添加事件监听器
  const styleInputs = [
    'originalFontFamily', 'originalFontSize', 'originalColor', 'originalFontWeight',
    'translationFontFamily', 'translationFontSize', 'translationColor', 'translationFontWeight',
    'timestampFontFamily', 'timestampFontSize', 'timestampColor'
  ];
  
  styleInputs.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', updateResultStyles);
    }
  });
});