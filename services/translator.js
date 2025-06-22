const axios = require('axios');

class TranslatorService {
  constructor() {
    this.aiModels = {
      "deepseek-v3-0324": {
        name: "DeepSeek V3-0324 🔥",
        inputPrice: 0.27,
        outputPrice: 1.10,
        description: "DeepSeek V3-0324最新版本，翻译质量卓越",
        provider: "deepseek",
        apiModel: "deepseek-chat",
        apiUrl: "https://api.deepseek.com/chat/completions"
      },
      "deepseek-r1-0528": {
        name: "DeepSeek R1-0528 🚀",
        inputPrice: 0.55,
        outputPrice: 2.19,
        description: "DeepSeek R1-0528推理模型，逻辑思维能力强",
        provider: "deepseek",
        apiModel: "deepseek-reasoner",
        apiUrl: "https://api.deepseek.com/chat/completions"
      },
      "gpt-4o-mini": {
        name: "GPT-4o Mini",
        inputPrice: 0.15,
        outputPrice: 0.60,
        description: "OpenAI性价比最高，适合大量翻译",
        provider: "openai",
        apiUrl: "https://api.openai-proxy.com/v1/chat/completions"
      },
      "gpt-4o": {
        name: "GPT-4o (最新)",
        inputPrice: 5.00,
        outputPrice: 15.00,
        description: "OpenAI最新最强模型，翻译质量最佳",
        provider: "openai",
        apiUrl: "https://api.openai-proxy.com/v1/chat/completions"
      },
      "gpt-3.5-turbo": {
        name: "GPT-3.5 Turbo",
        inputPrice: 0.50,
        outputPrice: 1.50,
        description: "OpenAI最便宜选项，基础翻译够用",
        provider: "openai",
        apiUrl: "https://api.openai-proxy.com/v1/chat/completions"
      },
      "gpt-4-turbo": {
        name: "GPT-4 Turbo",
        inputPrice: 10.00,
        outputPrice: 30.00,
        description: "OpenAI高质量翻译，速度较快",
        provider: "openai",
        apiUrl: "https://api.openai-proxy.com/v1/chat/completions"
      },
      "gpt-4": {
        name: "GPT-4",
        inputPrice: 30.00,
        outputPrice: 60.00,
        description: "OpenAI经典GPT-4，质量稳定但较贵",
        provider: "openai",
        apiUrl: "https://api.openai-proxy.com/v1/chat/completions"
      }
    };
  }

  /**
   * 检测文本语言
   * @param {string} text - 要检测的文本
   * @returns {string} - 语言代码
   */
  detectLanguage(text) {
    // 日语检测（平假名、片假名）
    const hiraganaKatakana = /[\u3040-\u309F\u30A0-\u30FF]/.test(text);
    // 中文检测
    const chineseChars = /[\u4E00-\u9FAF]/.test(text);
    // 韩语检测
    const koreanChars = /[\uAC00-\uD7AF]/.test(text);
    // 英文检测
    const englishChars = /[a-zA-Z]/.test(text);
    
    // 按优先级判断
    if (hiraganaKatakana) {
      return 'ja';
    } else if (koreanChars) {
      return 'ko';
    } else if (chineseChars && !hiraganaKatakana) {
      return 'zh';
    } else if (englishChars && !chineseChars && !hiraganaKatakana && !koreanChars) {
      return 'en';
    }
    
    return 'unknown';
  }

  /**
   * 预处理文本（应用术语词典）
   * @param {string} text - 原始文本
   * @param {object} customTerms - 自定义术语词典
   * @returns {object} - {text: 处理后的文本, replacements: 替换记录}
   */
  preprocessText(text, customTerms = {}) {
    let processedText = text;
    const replacements = [];
    
    // 按术语长度降序排序，优先替换长术语
    const sortedTerms = Object.entries(customTerms).sort((a, b) => b[0].length - a[0].length);
    
    for (const [term, translation] of sortedTerms) {
      if (processedText.includes(term)) {
        // 使用全词匹配避免部分替换
        const regex = new RegExp(term, 'g');
        processedText = processedText.replace(regex, translation);
        replacements.push(`${term} → ${translation}`);
      }
    }
    
    return { text: processedText, replacements };
  }

  /**
   * 构建翻译提示词
   * @param {string} text - 要翻译的文本
   * @param {string} sourceLang - 源语言
   * @param {string} targetLang - 目标语言
   * @param {boolean} qualityMode - 是否启用质量增强模式
   * @returns {string} - 提示词
   */
  buildPrompt(text, sourceLang, targetLang, qualityMode = false) {
    const langNames = {
      'ja': '日语',
      'zh': '中文',
      'en': '英语',
      'ko': '韩语',
      'es': '西班牙语',
      'fr': '法语',
      'de': '德语',
      'ru': '俄语',
      'auto': '自动检测'
    };
    
    const sourceName = langNames[sourceLang] || sourceLang;
    const targetName = langNames[targetLang] || targetLang;
    
    if (qualityMode) {
      return `请将以下${sourceName}文本翻译成${targetName}：

原文：${text}

要求：
1. 保持原意准确，特别注意专有名词和公司名称的正确性
2. 语言表达自然流畅，符合${targetName}的表达习惯
3. 保持原文的语气、敬语程度和情感色彩
4. 专业术语要准确翻译，保持行业规范
5. 语气词和口语表达要自然转换，避免生硬直译
6. 格式和标点符号要符合${targetName}的使用规范
7. 如有文化相关内容，请适当本地化
8. 只返回翻译结果，不要添加任何解释或说明

注意事项：
- 已预处理的专有名词请保持不变
- 数字、日期、时间等要按照${targetName}习惯表达
- 保持原文的段落结构`;
    } else {
      return `请将以下${sourceName}文本翻译成${targetName}：

原文：${text}

要求：
1. 保持原意准确
2. 语言自然流畅
3. 已预处理的专有名词请保持不变
4. 只返回翻译结果，不要添加任何解释`;
    }
  }

  /**
   * 调用翻译API
   * @param {object} options - 翻译选项
   * @returns {Promise<object>} - 翻译结果
   */
  async translate(options) {
    const {
      text,
      modelKey,
      openaiKey,
      deepseekKey,
      sourceLang = 'auto',
      targetLang = 'zh',
      customTerms = {},
      translationPrompt = null,
      maxRetries = 3
    } = options;

    // 参数验证
    if (!text || !text.trim()) {
      throw new Error('翻译文本不能为空');
    }

    if (!modelKey || !this.aiModels[modelKey]) {
      throw new Error('无效的模型选择');
    }

    const model = this.aiModels[modelKey];
    const provider = model.provider || 'openai';
    
    // 根据模型提供商选择对应的API Key
    let apiKey;
    if (provider === 'deepseek') {
      apiKey = deepseekKey;
      if (!apiKey || !apiKey.trim()) {
        throw new Error('请配置DeepSeek API Key');
      }
    } else {
      apiKey = openaiKey;
      if (!apiKey || !apiKey.trim()) {
        throw new Error('请配置OpenAI API Key');
      }
    }
    
    // 自动检测语言
    let detectedLang = sourceLang;
    if (sourceLang === 'auto') {
      detectedLang = this.detectLanguage(text);
      if (detectedLang === 'unknown') {
        detectedLang = 'en'; // 默认英语
      }
    }

    // 如果源语言和目标语言相同，直接返回
    if (detectedLang === targetLang) {
      return {
        originalText: text,
        translatedText: text,
        sourceLang: detectedLang,
        targetLang: targetLang,
        usage: null,
        cached: true
      };
    }

    // 预处理文本
    const { text: processedText, replacements } = this.preprocessText(text, customTerms);

    // 构建翻译提示词
    const langNames = {
      'ja': '日语',
      'zh': '中文',
      'en': '英语',
      'ko': '韩语',
      'es': '西班牙语',
      'fr': '法语',
      'de': '德语',
      'ru': '俄语',
      'auto': '自动检测'
    };
    
    const sourceName = langNames[detectedLang] || detectedLang;
    const targetName = langNames[targetLang] || targetLang;
    
    // 使用配置的prompt或默认prompt
    let systemPrompt, userPrompt;
    if (translationPrompt) {
      systemPrompt = translationPrompt.systemPrompt;
      userPrompt = translationPrompt.userPromptTemplate
        .replace('{sourceLang}', sourceName)
        .replace('{targetLang}', targetName)
        .replace('{text}', processedText);
    } else {
      // 默认prompt
      systemPrompt = '你是专业的翻译助手，提供准确、自然的翻译。';
      userPrompt = `请将以下${sourceName}文本翻译成${targetName}：\n\n原文：${processedText}\n\n要求：\n1. 保持原意准确\n2. 语言自然流畅\n3. 已预处理的专有名词请保持不变\n4. 只返回翻译结果，不要添加任何解释`;
    }

    // 构建请求体
    const requestBody = {
      model: model.apiModel || modelKey,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 600,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    // 重试逻辑
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(model.apiUrl, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 30000 // 30秒超时
        });

        const translatedText = response.data.choices[0].message.content.trim();
        
        return {
          originalText: text,
          translatedText: translatedText,
          processedText: processedText,
          sourceLang: detectedLang,
          targetLang: targetLang,
          replacements: replacements,
          usage: response.data.usage,
          model: model.name,
          cached: false
        };

      } catch (error) {
        lastError = error;
        
        // 处理特定错误
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;
          
          if (status === 401) {
            throw new Error('API Key无效或已过期');
          } else if (status === 429) {
            // 速率限制，等待后重试
            if (attempt < maxRetries) {
              await this.sleep(Math.pow(2, attempt) * 1000); // 指数退避
              continue;
            }
            throw new Error('API调用频率超限，请稍后再试');
          } else if (status === 400) {
            throw new Error(`请求参数错误: ${errorData.error?.message || '未知错误'}`);
          } else if (status >= 500) {
            // 服务器错误，重试
            if (attempt < maxRetries) {
              await this.sleep(2000);
              continue;
            }
            throw new Error('翻译服务暂时不可用，请稍后再试');
          }
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('请求超时，请检查网络连接');
        } else if (error.code === 'ENOTFOUND') {
          throw new Error('无法连接到翻译服务，请检查网络');
        }
        
        // 其他错误，继续重试
        if (attempt < maxRetries) {
          await this.sleep(1000);
          continue;
        }
      }
    }
    
    // 所有重试失败
    throw new Error(`翻译失败: ${lastError.message || '未知错误'}`);
  }

  /**
   * 批量翻译
   * @param {object} options - 批量翻译选项
   * @returns {Promise<array>} - 翻译结果数组
   */
  async batchTranslate(options) {
    const {
      texts,
      modelKey,
      openaiKey,
      deepseekKey,
      sourceLang = 'auto',
      targetLang = 'zh',
      customTerms = {},
      translationPrompt = null,
      onProgress = null,
      concurrency = 1 // 并发数
    } = options;

    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('批量翻译文本不能为空');
    }

    const results = [];
    const errors = [];
    
    // 分批处理
    for (let i = 0; i < texts.length; i += concurrency) {
      const batch = texts.slice(i, i + concurrency);
      const batchPromises = batch.map((text, index) => {
        return this.translate({
          text,
          modelKey,
          openaiKey,
          deepseekKey,
          sourceLang,
          targetLang,
          qualityMode,
          customTerms
        }).then(result => {
          const globalIndex = i + index;
          results[globalIndex] = result;
          if (onProgress) {
            onProgress({
              current: globalIndex + 1,
              total: texts.length,
              result: result
            });
          }
        }).catch(error => {
          const globalIndex = i + index;
          errors[globalIndex] = error;
          if (onProgress) {
            onProgress({
              current: globalIndex + 1,
              total: texts.length,
              error: error
            });
          }
        });
      });
      
      await Promise.all(batchPromises);
      
      // 避免API限制
      if (i + concurrency < texts.length) {
        await this.sleep(500);
      }
    }
    
    return { results, errors };
  }

  /**
   * 计算翻译成本
   * @param {object} usage - 使用情况
   * @param {string} modelKey - 模型键
   * @returns {number} - 成本（美元）
   */
  calculateCost(usage, modelKey) {
    if (!usage || !this.aiModels[modelKey]) {
      return 0;
    }
    
    const model = this.aiModels[modelKey];
    const inputCost = (usage.prompt_tokens / 1000000) * model.inputPrice;
    const outputCost = (usage.completion_tokens / 1000000) * model.outputPrice;
    
    return inputCost + outputCost;
  }

  /**
   * 估算文本token数量
   * @param {string} text - 文本
   * @returns {number} - 估算的token数
   */
  estimateTokens(text) {
    // 简单估算：英文约4字符/token，中文约2字符/token
    const englishChars = (text.match(/[a-zA-Z\s]/g) || []).length;
    const chineseChars = (text.match(/[\u4E00-\u9FAF]/g) || []).length;
    const otherChars = text.length - englishChars - chineseChars;
    
    return Math.ceil(englishChars / 4 + chineseChars / 2 + otherChars / 3);
  }

  /**
   * 睡眠函数
   * @param {number} ms - 毫秒数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = TranslatorService;