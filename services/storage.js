const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

class StorageService {
  constructor() {
    // 使用用户数据目录，确保稳定性和权限
    this.dataPath = app.getPath('userData');
    this.configFile = path.join(this.dataPath, 'config.json');
    this.termsFile = path.join(this.dataPath, 'terms.json');
    this.cacheFile = path.join(this.dataPath, 'cache.json');
    this.secretKey = this.getOrCreateSecretKey();
    
    console.log('StorageService 数据路径:', this.dataPath);
    console.log('配置文件路径:', this.configFile);
    
    // 确保数据目录存在
    try {
      require('fs').mkdirSync(this.dataPath, { recursive: true });
    } catch (error) {
      // 目录可能已存在，忽略错误
    }
  }



  /**
   * 获取或创建密钥
   */
  getOrCreateSecretKey() {
    const keyFile = path.join(this.dataPath, '.key');
    try {
      const key = require('fs').readFileSync(keyFile, 'utf8');
      return key;
    } catch (error) {
      // 生成新密钥
      const key = crypto.randomBytes(32).toString('hex');
      require('fs').writeFileSync(keyFile, key);
      return key;
    }
  }

  /**
   * 加密数据
   * @param {string} text - 要加密的文本
   * @returns {string} - 加密后的文本
   */
  encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(this.secretKey, 'hex').slice(0, 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密数据
   * @param {string} text - 要解密的文本
   * @returns {string} - 解密后的文本
   */
  decrypt(text) {
    try {
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(this.secretKey, 'hex').slice(0, 32);
      const parts = text.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('解密失败:', error);
      return text; // 返回原文本
    }
  }

  /**
   * 保存配置
   * @param {object} config - 配置对象
   * @returns {Promise<object>} - 操作结果
   */
  async saveConfig(config) {
    try {
      // 确保目录存在
      await this.ensureDirectory();
      
      // 加密敏感数据
      const safeConfig = { ...config };
      if (safeConfig.openaiKey) {
        safeConfig.openaiKey = this.encrypt(safeConfig.openaiKey);
      }
      if (safeConfig.deepseekKey) {
        safeConfig.deepseekKey = this.encrypt(safeConfig.deepseekKey);
      }
      
      // 保存配置
      await fs.writeFile(
        this.configFile, 
        JSON.stringify(safeConfig, null, 2),
        'utf8'
      );
      
      return { success: true };
    } catch (error) {
      console.error('保存配置失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 加载配置
   * @returns {Promise<object>} - 配置对象
   */
  async loadConfig() {
    try {
      const data = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(data);
      
      // 解密敏感数据
      if (config.openaiKey) {
        config.openaiKey = this.decrypt(config.openaiKey);
      }
      if (config.deepseekKey) {
        config.deepseekKey = this.decrypt(config.deepseekKey);
      }
      
      return { success: true, config };
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 文件不存在，返回默认配置
        return { 
          success: true, 
          config: this.getDefaultConfig() 
        };
      }
      console.error('加载配置失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig() {
    return {
      // API配置 - 只有这两个保持空值
      openaiKey: '',
      deepseekKey: '',
      
      // AI模型设置 - 默认使用DeepSeek V3
      selectedModel: 'deepseek-v3-0324',
      
      // 语言设置 - 默认日译中
      sourceLang: 'ja',
      targetLang: 'zh',
      
      // 剪贴板监听设置 - 默认开启监听，关闭自动复制避免循环
      clipboardMonitor: true,
      autoCopyResult: false,
      
      // 界面设置
      theme: 'light',
      fontSize: 14,
      windowSize: { width: 1200, height: 900 },
      
      // 快捷键设置
      shortcuts: {
        translate: 'Ctrl+Enter',
        clear: 'Ctrl+L',
        paste: 'Ctrl+Shift+V'
      },
      
      // 术语词典 - 包含常用术语
      customTerms: this.getDefaultTerms(),
      
      // 翻译prompt配置 - 优化的默认提示词
      translationPrompt: {
        systemPrompt: '你是专业的翻译助手，特别擅长日中翻译，对商务用语和技术术语有深入理解。',
        userPromptTemplate: '请将以下{sourceLang}文本翻译成{targetLang}：\n\n原文：{text}\n\n要求：\n1. 保持原意准确，语言自然流畅\n2. 商务敬语要恰当转换\n3. 专有名词和已预处理术语保持不变\n4. 只返回翻译结果，不要添加解释'
      },
      
      // 高级设置
      maxRetries: 3,              // API调用最大重试次数
      requestTimeout: 30000,      // 请求超时时间(毫秒)
      batchSize: 10,              // 批量翻译每批数量
      autoSave: true,             // 自动保存配置
      historyLimit: 1000,         // 历史记录保存数量
      
      // 过滤设置 - 避免翻译不必要的内容
      filterSettings: {
        minLength: 2,             // 最小翻译长度
        maxLength: 5000,          // 最大翻译长度
        skipPatterns: [           // 跳过的模式
          '^sk-',                 // API Key
          '^https?://',           // URL
          '^\\d+$',               // 纯数字
          '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' // 邮箱
        ]
      },
      // 翻译结果样式配置
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
  }

  /**
   * 保存术语词典
   * @param {object} terms - 术语词典
   */
  async saveTerms(terms) {
    try {
      await this.ensureDirectory();
      await fs.writeFile(
        this.termsFile,
        JSON.stringify(terms, null, 2),
        'utf8'
      );
      return { success: true };
    } catch (error) {
      console.error('保存术语词典失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 加载术语词典
   */
  async loadTerms() {
    try {
      const data = await fs.readFile(this.termsFile, 'utf8');
      return { success: true, terms: JSON.parse(data) };
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 返回默认术语
        return { success: true, terms: this.getDefaultTerms() };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取默认术语词典
   */
  getDefaultTerms() {
    return {
      "アーバンも": "Avamo",
      "アバモ": "Avamo",
      "エアテレント": "AI Talent",
      "ホリプロ": "Horipro",
      "クリエイティブチェック": "创意审核",
      "アバター": "虚拟形象",
      "タレント": "艺人",
      "ネイティブチェック": "母语审核"
    };
  }

  /**
   * 缓存管理
   */
  async saveCache(key, value, ttl = 3600000) { // 默认1小时
    try {
      let cache = {};
      try {
        const data = await fs.readFile(this.cacheFile, 'utf8');
        cache = JSON.parse(data);
      } catch (error) {
        // 缓存文件不存在
      }
      
      cache[key] = {
        value: value,
        expire: Date.now() + ttl
      };
      
      // 清理过期缓存
      const now = Date.now();
      for (const k in cache) {
        if (cache[k].expire < now) {
          delete cache[k];
        }
      }
      
      await fs.writeFile(
        this.cacheFile,
        JSON.stringify(cache),
        'utf8'
      );
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getCache(key) {
    try {
      const data = await fs.readFile(this.cacheFile, 'utf8');
      const cache = JSON.parse(data);
      
      if (cache[key]) {
        if (cache[key].expire > Date.now()) {
          return { success: true, value: cache[key].value };
        } else {
          // 已过期
          delete cache[key];
          await fs.writeFile(
            this.cacheFile,
            JSON.stringify(cache),
            'utf8'
          );
        }
      }
      
      return { success: false, error: 'Cache not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async clearCache() {
    try {
      await fs.writeFile(this.cacheFile, '{}', 'utf8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 导出配置
   * @param {string} exportPath - 导出路径
   */
  async exportConfig(exportPath) {
    try {
      const config = await this.loadConfig();
      if (config.success) {
        // 移除敏感信息
        const exportData = { ...config.config };
        delete exportData.openaiKey;
        delete exportData.deepseekKey;
        
        await fs.writeFile(
          exportPath,
          JSON.stringify(exportData, null, 2),
          'utf8'
        );
        
        return { success: true };
      }
      return config;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 导入配置
   * @param {string} importPath - 导入路径
   */
  async importConfig(importPath) {
    try {
      const data = await fs.readFile(importPath, 'utf8');
      const importedConfig = JSON.parse(data);
      
      // 合并配置（保留现有的API Keys）
      const currentConfig = await this.loadConfig();
      if (currentConfig.success) {
        const mergedConfig = {
          ...importedConfig,
          openaiKey: currentConfig.config.openaiKey,
          deepseekKey: currentConfig.config.deepseekKey
        };
        
        return await this.saveConfig(mergedConfig);
      }
      
      return { success: false, error: '无法加载当前配置' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 确保目录存在
   */
  async ensureDirectory() {
    try {
      await fs.access(this.dataPath);
    } catch (error) {
      await fs.mkdir(this.dataPath, { recursive: true });
    }
  }

  /**
   * 获取统计信息
   */
  async getStatistics() {
    try {
      const statsFile = path.join(this.dataPath, 'statistics.json');
      const data = await fs.readFile(statsFile, 'utf8');
      return { success: true, stats: JSON.parse(data) };
    } catch (error) {
      // 返回默认统计
      return {
        success: true,
        stats: {
          totalTranslations: 0,
          totalTokens: 0,
          totalCost: 0,
          dailyStats: {},
          modelUsage: {}
        }
      };
    }
  }

  /**
   * 更新统计信息
   */
  async updateStatistics(translation) {
    try {
      const statsFile = path.join(this.dataPath, 'statistics.json');
      let stats = (await this.getStatistics()).stats;
      
      // 更新总计
      stats.totalTranslations++;
      if (translation.usage) {
        stats.totalTokens += (translation.usage.total_tokens || 0);
      }
      if (translation.cost) {
        stats.totalCost += translation.cost;
      }
      
      // 更新每日统计
      const today = new Date().toISOString().split('T')[0];
      if (!stats.dailyStats[today]) {
        stats.dailyStats[today] = {
          translations: 0,
          tokens: 0,
          cost: 0
        };
      }
      stats.dailyStats[today].translations++;
      if (translation.usage) {
        stats.dailyStats[today].tokens += (translation.usage.total_tokens || 0);
      }
      if (translation.cost) {
        stats.dailyStats[today].cost += translation.cost;
      }
      
      // 更新模型使用统计
      const model = translation.model || 'unknown';
      if (!stats.modelUsage[model]) {
        stats.modelUsage[model] = {
          count: 0,
          tokens: 0,
          cost: 0
        };
      }
            // 更新模型使用统计（续）
      stats.modelUsage[model].count++;
      if (translation.usage) {
        stats.modelUsage[model].tokens += (translation.usage.total_tokens || 0);
      }
      if (translation.cost) {
        stats.modelUsage[model].cost += translation.cost;
      }
      
      // 保存统计
      await fs.writeFile(
        statsFile,
        JSON.stringify(stats, null, 2),
        'utf8'
      );
      
      return { success: true };
    } catch (error) {
      console.error('更新统计失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取翻译历史
   * @param {number} limit - 限制数量
   * @param {number} offset - 偏移量
   */
  async getTranslationHistory(limit = 50, offset = 0) {
    try {
      const historyFile = path.join(this.dataPath, 'history.json');
      const data = await fs.readFile(historyFile, 'utf8');
      const history = JSON.parse(data);
      
      // 按时间倒序排序
      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // 分页
      const paged = history.slice(offset, offset + limit);
      
      return {
        success: true,
        history: paged,
        total: history.length,
        hasMore: offset + limit < history.length
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: true, history: [], total: 0, hasMore: false };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * 添加翻译历史
   * @param {object} translation - 翻译记录
   */
  async addTranslationHistory(translation) {
    try {
      const historyFile = path.join(this.dataPath, 'history.json');
      let history = [];
      
      try {
        const data = await fs.readFile(historyFile, 'utf8');
        history = JSON.parse(data);
      } catch (error) {
        // 历史文件不存在
      }
      
      // 添加时间戳和ID
      const record = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...translation
      };
      
      history.push(record);
      
      // 限制历史记录数量（最多保留1000条）
      if (history.length > 1000) {
        history = history.slice(-1000);
      }
      
      await fs.writeFile(
        historyFile,
        JSON.stringify(history, null, 2),
        'utf8'
      );
      
      return { success: true, id: record.id };
    } catch (error) {
      console.error('添加历史记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 清除翻译历史
   */
  async clearTranslationHistory() {
    try {
      const historyFile = path.join(this.dataPath, 'history.json');
      await fs.writeFile(historyFile, '[]', 'utf8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 导出翻译历史
   * @param {string} format - 导出格式 (json, csv, txt)
   * @param {string} outputPath - 输出路径
   */
  async exportHistory(format = 'json', outputPath) {
    try {
      const result = await this.getTranslationHistory(Number.MAX_SAFE_INTEGER);
      if (!result.success) {
        return result;
      }
      
      const history = result.history;
      let content = '';
      
      switch (format) {
        case 'csv':
          // CSV格式
          content = 'Timestamp,Source Language,Target Language,Original Text,Translated Text,Model,Cost\n';
          history.forEach(item => {
            content += `"${item.timestamp}","${item.sourceLang}","${item.targetLang}","${item.originalText.replace(/"/g, '""')}","${item.translatedText.replace(/"/g, '""')}","${item.model || ''}","${item.cost || 0}"\n`;
          });
          break;
          
        case 'txt':
          // 纯文本格式
          history.forEach(item => {
            content += `=== ${item.timestamp} ===\n`;
            content += `模型: ${item.model || 'Unknown'}\n`;
            content += `语言: ${item.sourceLang} → ${item.targetLang}\n`;
            content += `原文: ${item.originalText}\n`;
            content += `译文: ${item.translatedText}\n`;
            content += `成本: $${item.cost || 0}\n\n`;
          });
          break;
          
        default:
          // JSON格式
          content = JSON.stringify(history, null, 2);
      }
      
      await fs.writeFile(outputPath, content, 'utf8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 备份所有数据
   * @param {string} backupPath - 备份路径
   */
  async backupData(backupPath) {
    try {
      const backup = {
        version: '2.1.0',
        timestamp: new Date().toISOString(),
        config: (await this.loadConfig()).config,
        terms: (await this.loadTerms()).terms,
        statistics: (await this.getStatistics()).stats,
        history: (await this.getTranslationHistory(Number.MAX_SAFE_INTEGER)).history
      };
      
      // 移除敏感信息
      if (backup.config) {
        delete backup.config.openaiKey;
        delete backup.config.deepseekKey;
      }
      
      await fs.writeFile(
        backupPath,
        JSON.stringify(backup, null, 2),
        'utf8'
      );
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 恢复数据
   * @param {string} backupPath - 备份文件路径
   */
  async restoreData(backupPath) {
    try {
      const data = await fs.readFile(backupPath, 'utf8');
      const backup = JSON.parse(data);
      
      // 检查版本兼容性
      if (!backup.version || !backup.version.startsWith('2.')) {
        return { success: false, error: '备份文件版本不兼容' };
      }
      
      // 恢复配置（保留当前的API Keys）
      if (backup.config) {
        const currentConfig = await this.loadConfig();
        if (currentConfig.success) {
          backup.config.openaiKey = currentConfig.config.openaiKey;
          backup.config.deepseekKey = currentConfig.config.deepseekKey;
        }
        await this.saveConfig(backup.config);
      }
      
      // 恢复术语词典
      if (backup.terms) {
        await this.saveTerms(backup.terms);
      }
      
      // 恢复统计信息
      if (backup.statistics) {
        const statsFile = path.join(this.dataPath, 'statistics.json');
        await fs.writeFile(
          statsFile,
          JSON.stringify(backup.statistics, null, 2),
          'utf8'
        );
      }
      
      // 恢复历史记录
      if (backup.history) {
        const historyFile = path.join(this.dataPath, 'history.json');
        await fs.writeFile(
          historyFile,
          JSON.stringify(backup.history, null, 2),
          'utf8'
        );
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取存储空间使用情况
   */
  async getStorageInfo() {
    try {
      const files = [
        { name: 'config.json', path: this.configFile },
        { name: 'terms.json', path: this.termsFile },
        { name: 'cache.json', path: this.cacheFile },
        { name: 'history.json', path: path.join(this.dataPath, 'history.json') },
        { name: 'statistics.json', path: path.join(this.dataPath, 'statistics.json') }
      ];
      
      let totalSize = 0;
      const fileInfo = [];
      
      for (const file of files) {
        try {
          const stats = await fs.stat(file.path);
          totalSize += stats.size;
          fileInfo.push({
            name: file.name,
            size: stats.size,
            modified: stats.mtime
          });
        } catch (error) {
          // 文件不存在
          fileInfo.push({
            name: file.name,
            size: 0,
            modified: null
          });
        }
      }
      
      return {
        success: true,
        totalSize,
        files: fileInfo,
        dataPath: this.dataPath
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 清理过期数据
   * @param {number} daysToKeep - 保留天数
   */
  async cleanupOldData(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      // 清理历史记录
      const historyResult = await this.getTranslationHistory(Number.MAX_SAFE_INTEGER);
      if (historyResult.success) {
        const filteredHistory = historyResult.history.filter(item => {
          return new Date(item.timestamp) > cutoffDate;
        });
        
        const historyFile = path.join(this.dataPath, 'history.json');
        await fs.writeFile(
          historyFile,
          JSON.stringify(filteredHistory, null, 2),
          'utf8'
        );
      }
      
      // 清理统计数据
      const statsResult = await this.getStatistics();
      if (statsResult.success) {
        const stats = statsResult.stats;
        
        // 清理过期的每日统计
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
        for (const date in stats.dailyStats) {
          if (date < cutoffDateStr) {
            delete stats.dailyStats[date];
          }
        }
        
        const statsFile = path.join(this.dataPath, 'statistics.json');
        await fs.writeFile(
          statsFile,
          JSON.stringify(stats, null, 2),
          'utf8'
        );
      }
      
      // 清理缓存
      await this.clearCache();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = StorageService;