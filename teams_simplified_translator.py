"""
Teams简化版实时翻译系统
适用于普通用户，无需高级Azure权限
支持多种GPT模型选择和成本控制
支持剪贴板监听自动翻译
"""
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import requests
import json
import time
import threading
from datetime import datetime
import re
import pyperclip
try:
    from openai import OpenAI
    OPENAI_V1 = True
except ImportError:
    import openai
    OPENAI_V1 = False

class SimplifiedTeamsTranslator:
    """简化版Teams翻译器 - 无需高级权限"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Teams简化版实时翻译助手 v2.1")
        self.root.geometry("1000x800")  # 增大窗口尺寸
        
        # 默认API Key（请替换为您的实际Key）
        self.default_api_key = ""  # 在这里设置您的默认OpenAI API Key
        self.default_dsapi_key = ""  # 在这里设置您的默认DeepSeek API Key
        
        # AI模型配置
        self.ai_models = {
            # OpenAI模型
            "gpt-4o": {
                "name": "GPT-4o (最新)",
                "input_price": "$5.00/1M tokens",
                "output_price": "$15.00/1M tokens",
                "description": "OpenAI最新最强模型，翻译质量最佳",
                "provider": "openai",
                "recommended": True
            },
            "gpt-4o-mini": {
                "name": "GPT-4o Mini",
                "input_price": "$0.15/1M tokens", 
                "output_price": "$0.60/1M tokens",
                "description": "OpenAI性价比最高，适合大量翻译",
                "provider": "openai",
                "recommended": True
            },
            "gpt-4-turbo": {
                "name": "GPT-4 Turbo",
                "input_price": "$10.00/1M tokens",
                "output_price": "$30.00/1M tokens", 
                "description": "OpenAI高质量翻译，速度较快",
                "provider": "openai"
            },
            "gpt-4": {
                "name": "GPT-4",
                "input_price": "$30.00/1M tokens",
                "output_price": "$60.00/1M tokens",
                "description": "OpenAI经典GPT-4，质量稳定但较贵",
                "provider": "openai"
            },
            "gpt-3.5-turbo": {
                "name": "GPT-3.5 Turbo",
                "input_price": "$0.50/1M tokens",
                "output_price": "$1.50/1M tokens", 
                "description": "OpenAI最便宜选项，基础翻译够用",
                "provider": "openai"
            },
            # DeepSeek模型 (界面显示友好名称，API使用官方名称)
            "deepseek-v3-0324": {
                "name": "DeepSeek V3-0324 🔥",
                "input_price": "$0.27/1M tokens",
                "output_price": "$1.10/1M tokens",
                "description": "DeepSeek V3-0324最新版本，翻译质量卓越",
                "provider": "deepseek",
                "api_model": "deepseek-chat",  # 实际API调用时使用的模型名
                "recommended": True
            },
            "deepseek-r1-0528": {
                "name": "DeepSeek R1-0528 🚀",
                "input_price": "$0.55/1M tokens",
                "output_price": "$2.19/1M tokens",
                "description": "DeepSeek R1-0528推理模型，逻辑思维能力强",
                "provider": "deepseek",
                "api_model": "deepseek-reasoner",  # 实际API调用时使用的模型名
                "recommended": True
            }
        }
        
        # 配置变量
        self.openai_key_var = tk.StringVar(value=self.default_api_key)
        self.deepseek_key_var = tk.StringVar(value=self.default_dsapi_key)  # DeepSeek API Key
        self.webhook_url_var = tk.StringVar()
        self.selected_model_var = tk.StringVar(value="deepseek-v3-0324")  # 默认最新DeepSeek R1模型
        
        # 翻译设置
        self.source_lang_var = tk.StringVar(value="ja")
        self.target_lang_var = tk.StringVar(value="zh")
        self.translation_mode_var = tk.StringVar(value="auto")
        
        # 剪贴板监听设置
        self.clipboard_monitor_var = tk.BooleanVar(value=True)  # 默认开启剪贴板监听
        self.auto_copy_result_var = tk.BooleanVar(value=True)   # 默认开启自动复制结果
        self.last_clipboard_content = ""
        self.clipboard_thread = None
        
        # 结果显示模式
        self.result_mode_var = tk.StringVar(value="append")  # append 或 clear
        
        # 自定义术语词典
        self.custom_terms = {
            # 日语原文: 正确翻译
            "アーバンも": "Avamo",
            "アバモ": "Avamo", 
            "エアテレント": "AI Talent",
            "ホリプロ": "Horipro",
            "クリエイティブチェック": "创意审核",
            "アバター": "avatar",
            "タレント": "艺人",
            "ネイティブチェック": "母语审核"
        }
        
        # 成本统计
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.estimated_cost = 0.0
        
        # 状态管理
        self.is_running = False
        self.translation_thread = None
        
        self.create_widgets()
        
    def create_widgets(self):
        """创建界面组件"""
        # 主框架
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 配置区域
        config_frame = ttk.LabelFrame(main_frame, text="API配置", padding="10")
        config_frame.pack(fill=tk.X, pady=(0, 10))
        
        # OpenAI配置
        ttk.Label(config_frame, text="OpenAI API Key:").grid(row=0, column=0, sticky=tk.W, padx=5)
        openai_key_entry = ttk.Entry(config_frame, textvariable=self.openai_key_var, width=50, show="*")
        openai_key_entry.grid(row=0, column=1, padx=5, sticky=(tk.W, tk.E))
        
        # OpenAI显示/隐藏按钮
        def toggle_openai_key_visibility():
            if openai_key_entry['show'] == '*':
                openai_key_entry.config(show='')
                openai_toggle_btn.config(text="隐藏")
            else:
                openai_key_entry.config(show='*')
                openai_toggle_btn.config(text="显示")
        
        openai_toggle_btn = ttk.Button(config_frame, text="显示", command=toggle_openai_key_visibility, width=8)
        openai_toggle_btn.grid(row=0, column=2, padx=5)
        
        # DeepSeek配置
        ttk.Label(config_frame, text="DeepSeek API Key:").grid(row=1, column=0, sticky=tk.W, padx=5)
        deepseek_key_entry = ttk.Entry(config_frame, textvariable=self.deepseek_key_var, width=50, show="*")
        deepseek_key_entry.grid(row=1, column=1, padx=5, sticky=(tk.W, tk.E))
        
        # DeepSeek显示/隐藏按钮
        def toggle_deepseek_key_visibility():
            if deepseek_key_entry['show'] == '*':
                deepseek_key_entry.config(show='')
                deepseek_toggle_btn.config(text="隐藏")
            else:
                deepseek_key_entry.config(show='*')
                deepseek_toggle_btn.config(text="显示")
        
        deepseek_toggle_btn = ttk.Button(config_frame, text="显示", command=toggle_deepseek_key_visibility, width=8)
        deepseek_toggle_btn.grid(row=1, column=2, padx=5)
        
        # 配置网格权重
        config_frame.columnconfigure(1, weight=1)
        
        # 模型选择区域
        model_frame = ttk.LabelFrame(main_frame, text="AI模型选择", padding="10")
        model_frame.pack(fill=tk.X, pady=(0, 10))
        
        # 模型选择下拉框
        ttk.Label(model_frame, text="选择模型:").grid(row=0, column=0, sticky=tk.W, padx=5)
        self.model_combo = ttk.Combobox(model_frame, textvariable=self.selected_model_var,
                                       values=list(self.ai_models.keys()), state="readonly", width=25)
        self.model_combo.grid(row=0, column=1, padx=5)
        self.model_combo.bind('<<ComboboxSelected>>', self.on_model_changed)
        
        # 模型信息显示
        self.model_info_frame = ttk.Frame(model_frame)
        self.model_info_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=10)
        
        # 成本统计显示
        cost_frame = ttk.Frame(model_frame)
        cost_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=5)
        
        self.cost_label = ttk.Label(cost_frame, text="本次会话成本: $0.00", foreground="green")
        self.cost_label.pack(side=tk.LEFT)
        
        ttk.Button(cost_frame, text="重置统计", command=self.reset_cost_stats).pack(side=tk.RIGHT)
        
        # 翻译设置和剪贴板监听
        settings_frame = ttk.LabelFrame(main_frame, text="翻译设置", padding="10")
        settings_frame.pack(fill=tk.X, pady=(0, 10))
        
        # 第一行：语言设置
        ttk.Label(settings_frame, text="源语言:").grid(row=0, column=0, sticky=tk.W, padx=5)
        source_combo = ttk.Combobox(settings_frame, textvariable=self.source_lang_var,
                                   values=["ja", "zh", "en", "auto"], state="readonly", width=15)
        source_combo.grid(row=0, column=1, padx=5)
        
        ttk.Label(settings_frame, text="目标语言:").grid(row=0, column=2, sticky=tk.W, padx=5)
        target_combo = ttk.Combobox(settings_frame, textvariable=self.target_lang_var,
                                   values=["zh", "ja", "en"], state="readonly", width=15)
        target_combo.grid(row=0, column=3, padx=5)
        
        # 语言快速切换按钮
        ttk.Button(settings_frame, text="🔄 切换", command=self.swap_languages, width=8).grid(row=0, column=4, padx=5)
        
        # 第二行：翻译模式和剪贴板监听
        ttk.Label(settings_frame, text="翻译模式:").grid(row=1, column=0, sticky=tk.W, padx=5)
        mode_combo = ttk.Combobox(settings_frame, textvariable=self.translation_mode_var,
                                 values=["auto", "japanese_only", "chinese_only"], state="readonly", width=15)
        mode_combo.grid(row=1, column=1, padx=5)
        
        # 剪贴板监听
        clipboard_check = ttk.Checkbutton(settings_frame, text="剪贴板监听翻译", 
                                         variable=self.clipboard_monitor_var,
                                         command=self.toggle_clipboard_monitor)
        clipboard_check.grid(row=1, column=2, sticky=tk.W, padx=5)
        
        # 第三行：高级选项
        ttk.Label(settings_frame, text="高级选项:").grid(row=2, column=0, sticky=tk.W, padx=5)
        
        # 自动复制结果选项
        auto_copy_check = ttk.Checkbutton(settings_frame, text="自动复制结果", 
                                         variable=self.auto_copy_result_var)
        auto_copy_check.grid(row=2, column=1, sticky=tk.W, padx=5)
        
        # 质量增强选项
        self.quality_enhance_var = tk.BooleanVar(value=False)
        quality_check = ttk.Checkbutton(settings_frame, text="质量增强模式", 
                                       variable=self.quality_enhance_var)
        quality_check.grid(row=2, column=2, sticky=tk.W, padx=5)
        
        # 添加提示标签
        ttk.Label(settings_frame, text="(重要翻译时启用)", foreground="gray", font=("Arial", 8)).grid(row=2, column=3, sticky=tk.W, padx=5)
        
        # 术语词典按钮
        ttk.Button(settings_frame, text="术语词典", command=self.open_terms_editor, width=10).grid(row=0, column=5, padx=5)
        
        # 输入区域
        input_frame = ttk.LabelFrame(main_frame, text="文本输入", padding="10")
        input_frame.pack(fill=tk.X, pady=(0, 10))
        
        # 文本输入框 - 增大高度
        self.input_text = scrolledtext.ScrolledText(input_frame, height=8, wrap=tk.WORD, font=("Arial", 10))
        self.input_text.pack(fill=tk.X, pady=5)
        
        # 按钮区域
        button_frame = ttk.Frame(input_frame)
        button_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(button_frame, text="翻译文本", command=self.translate_text).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="清空输入", command=self.clear_input).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="批量翻译", command=self.batch_translate).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="粘贴翻译", command=self.paste_and_translate).pack(side=tk.LEFT, padx=5)
        
        # 结果显示区域
        result_frame = ttk.LabelFrame(main_frame, text="翻译结果", padding="10")
        result_frame.pack(fill=tk.BOTH, expand=True)
        
        # 结果控制栏
        result_control_frame = ttk.Frame(result_frame)
        result_control_frame.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Label(result_control_frame, text="显示模式:").pack(side=tk.LEFT, padx=5)
        
        ttk.Radiobutton(result_control_frame, text="追加显示", variable=self.result_mode_var, 
                       value="append").pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(result_control_frame, text="清空显示", variable=self.result_mode_var, 
                       value="clear").pack(side=tk.LEFT, padx=5)
        
        ttk.Button(result_control_frame, text="清空结果", command=self.clear_results).pack(side=tk.RIGHT, padx=5)
        ttk.Button(result_control_frame, text="复制结果", command=self.copy_results).pack(side=tk.RIGHT, padx=5)
        
        # 结果显示文本框 - 增大高度
        self.result_text = scrolledtext.ScrolledText(result_frame, height=15, wrap=tk.WORD, font=("Arial", 10))
        self.result_text.pack(fill=tk.BOTH, expand=True)
        
        # 配置文本样式
        self.result_text.tag_configure("original", foreground="blue", font=("Arial", 10, "bold"))
        self.result_text.tag_configure("translation", foreground="green", font=("Arial", 10))
        self.result_text.tag_configure("timestamp", foreground="gray", font=("Arial", 9))
        self.result_text.tag_configure("cost", foreground="orange", font=("Arial", 9))
        self.result_text.tag_configure("clipboard", foreground="purple", font=("Arial", 9, "italic"))
        
        # 状态栏
        self.status_var = tk.StringVar(value="就绪 - 请配置OpenAI API Key")
        status_bar = ttk.Label(main_frame, textvariable=self.status_var, relief=tk.SUNKEN)
        status_bar.pack(fill=tk.X, pady=(5, 0))
        
        # 初始化模型信息显示
        self.update_model_info()
        
        # 如果有默认API Key，更新状态
        if self.default_api_key and not self.default_api_key.startswith("sk-your-default"):
            self.status_var.set("就绪 - 已加载默认API Key")
        
        # 自动启动剪贴板监听（如果默认开启）
        if self.clipboard_monitor_var.get():
            # 延迟启动，确保界面完全加载
            self.root.after(1000, self.auto_start_clipboard_monitor)
    
    def auto_start_clipboard_monitor(self):
        """自动启动剪贴板监听（程序启动时调用）"""
        try:
            self.start_clipboard_monitor()
        except Exception as e:
            # 如果自动启动失败，取消勾选状态
            self.clipboard_monitor_var.set(False)
            print(f"自动启动剪贴板监听失败: {e}")
    
    def toggle_clipboard_monitor(self):
        """切换剪贴板监听状态"""
        if self.clipboard_monitor_var.get():
            self.start_clipboard_monitor()
        else:
            self.stop_clipboard_monitor()
    
    def start_clipboard_monitor(self):
        """启动剪贴板监听"""
        # 检查API Key配置
        model_key = self.selected_model_var.get()
        model_info = self.ai_models[model_key]
        provider = model_info.get('provider', 'openai')
        
        if provider == "deepseek":
            if not self.deepseek_key_var.get().strip():
                messagebox.showerror("错误", "请先配置DeepSeek API Key")
                self.clipboard_monitor_var.set(False)
                return
        else:
            if not self.openai_key_var.get().strip() or self.openai_key_var.get().startswith("sk-your-default"):
                messagebox.showerror("错误", "请先配置有效的OpenAI API Key")
                self.clipboard_monitor_var.set(False)
                return
        
        self.is_running = True
        self.clipboard_thread = threading.Thread(target=self.clipboard_monitor_loop, daemon=True)
        self.clipboard_thread.start()
        
        self.status_var.set("剪贴板监听已启动 - 复制文本将自动翻译")
        self.append_result("🎯 剪贴板监听已启动", "clipboard")
        self.append_result("💡 提示：在Teams中复制文本将自动翻译", "clipboard")
    
    def stop_clipboard_monitor(self):
        """停止剪贴板监听"""
        self.is_running = False
        self.status_var.set("剪贴板监听已停止")
        self.append_result("🛑 剪贴板监听已停止", "clipboard")
    
    def clipboard_monitor_loop(self):
        """剪贴板监听循环"""
        while self.is_running:
            try:
                current_clipboard = pyperclip.paste()
                
                # 检查剪贴板内容是否变化且不为空
                if (current_clipboard != self.last_clipboard_content and 
                    current_clipboard.strip() and 
                    len(current_clipboard.strip()) > 1):
                    
                    # 检测语言并决定是否翻译
                    detected_lang = self.detect_language(current_clipboard)
                    
                    # 避免翻译循环：如果检测到的是目标语言，跳过翻译
                    if detected_lang == self.target_lang_var.get():
                        self.last_clipboard_content = current_clipboard
                        continue
                    
                    # 避免翻译API Key等敏感信息
                    if current_clipboard.startswith(('sk-', 'API', 'api')):
                        self.last_clipboard_content = current_clipboard
                        continue
                    
                    # 避免翻译过短的内容（可能是界面元素）
                    if len(current_clipboard.strip()) < 5:
                        self.last_clipboard_content = current_clipboard
                        continue
                    
                    if self.should_translate(detected_lang):
                        self.last_clipboard_content = current_clipboard
                        self.translate_clipboard_content(current_clipboard, detected_lang)
                    else:
                        self.last_clipboard_content = current_clipboard
                
                time.sleep(1)  # 每秒检查一次
                
            except Exception as e:
                print(f"剪贴板监听错误: {e}")
                time.sleep(2)
    
    def translate_clipboard_content(self, text, detected_lang):
        """翻译剪贴板内容"""
        try:
            # 在结果区域显示来源
            timestamp = datetime.now().strftime("%H:%M:%S")
            self.append_result(f"[{timestamp}] 📋 检测到剪贴板内容", "clipboard")
            
            # 执行翻译
            translation, usage_info = self.perform_translation(text, detected_lang)
            
            # 更新成本统计
            if usage_info:
                input_tokens = usage_info.get('prompt_tokens', 0)
                output_tokens = usage_info.get('completion_tokens', 0)
                
                self.total_input_tokens += input_tokens
                self.total_output_tokens += output_tokens
                
                cost = self.calculate_cost(input_tokens, output_tokens, self.selected_model_var.get())
                self.estimated_cost += cost
                self.update_cost_display()
                
                # 显示本次翻译成本
                cost_info = f"本次成本: ${cost:.4f} (输入:{input_tokens} 输出:{output_tokens} tokens)"
                self.append_result(cost_info, "cost")
            
            # 显示结果
            model_name = self.ai_models[self.selected_model_var.get()]['name']
            self.append_result(f"🎯 自动翻译完成 ({model_name})", "timestamp")
            self.append_result(f"原文 ({detected_lang}): {text}", "original")
            self.append_result(f"译文 ({self.target_lang_var.get()}): {translation}", "translation")
            self.append_result("=" * 50, "timestamp")
            
            # 根据设置决定是否自动复制翻译结果到剪贴板
            if self.auto_copy_result_var.get():
                # 更新剪贴板内容记录，避免循环翻译
                self.last_clipboard_content = translation
                pyperclip.copy(translation)
                self.append_result("📋 翻译结果已复制到剪贴板", "clipboard")
            else:
                self.append_result("💡 提示：可勾选'自动复制结果'选项自动复制翻译结果", "clipboard")
            
        except Exception as e:
            self.append_result(f"❌ 自动翻译失败: {e}", "timestamp")
    
    def paste_and_translate(self):
        """粘贴并翻译功能"""
        try:
            clipboard_content = pyperclip.paste()
            if clipboard_content.strip():
                # 清空输入框并粘贴内容
                self.input_text.delete("1.0", tk.END)
                self.input_text.insert("1.0", clipboard_content)
                
                # 执行翻译
                self.translate_text()
            else:
                messagebox.showwarning("警告", "剪贴板为空")
        except Exception as e:
            messagebox.showerror("错误", f"粘贴失败: {e}")
    
    def clear_results(self):
        """清空翻译结果"""
        self.result_text.delete("1.0", tk.END)
    
    def copy_results(self):
        """复制翻译结果"""
        try:
            content = self.result_text.get("1.0", tk.END).strip()
            if content:
                pyperclip.copy(content)
                messagebox.showinfo("成功", "翻译结果已复制到剪贴板")
            else:
                messagebox.showwarning("警告", "没有可复制的内容")
        except Exception as e:
            messagebox.showerror("错误", f"复制失败: {e}")
    
    def swap_languages(self):
        """快速切换源语言和目标语言"""
        current_source = self.source_lang_var.get()
        current_target = self.target_lang_var.get()
        
        # 如果源语言是auto，则不进行切换
        if current_source == "auto":
            messagebox.showinfo("提示", "源语言为自动检测时无法切换")
            return
        
        # 交换语言设置
        self.source_lang_var.set(current_target)
        self.target_lang_var.set(current_source)
        
        # 显示切换结果
        lang_names = {
            'ja': '日语',
            'zh': '中文', 
            'en': '英语'
        }
        
        source_name = lang_names.get(current_target, current_target)
        target_name = lang_names.get(current_source, current_source)
        
        self.append_result(f"🔄 语言已切换: {source_name} → {target_name}", "timestamp")
    
    def open_terms_editor(self):
        """打开术语词典编辑器"""
        TermsEditorWindow(self.root, self.custom_terms, self.update_custom_terms)
    
    def update_custom_terms(self, new_terms):
        """更新自定义术语词典"""
        self.custom_terms = new_terms
        self.append_result(f"📚 术语词典已更新，共{len(new_terms)}个术语", "timestamp")
    
    def preprocess_text_with_terms(self, text):
        """使用术语词典预处理文本"""
        processed_text = text
        replacements = []
        
        # 查找并替换术语
        for japanese_term, correct_term in self.custom_terms.items():
            if japanese_term in processed_text:
                processed_text = processed_text.replace(japanese_term, correct_term)
                replacements.append(f"{japanese_term} → {correct_term}")
        
        return processed_text, replacements
    
    def on_model_changed(self, event=None):
        """模型选择改变时的处理"""
        self.update_model_info()
        self.append_result(f"🔄 已切换到模型: {self.ai_models[self.selected_model_var.get()]['name']}", "timestamp")
    
    def update_model_info(self):
        """更新模型信息显示"""
        # 清除现有信息
        for widget in self.model_info_frame.winfo_children():
            widget.destroy()
        
        model_key = self.selected_model_var.get()
        model_info = self.ai_models[model_key]
        
        # 模型名称和推荐标识
        name_text = model_info['name']
        if model_info.get('recommended'):
            name_text += " ⭐ 推荐"
        
        ttk.Label(self.model_info_frame, text=name_text, font=("Arial", 10, "bold")).grid(row=0, column=0, sticky=tk.W)
        
        # 价格信息
        price_text = f"输入: {model_info['input_price']} | 输出: {model_info['output_price']}"
        ttk.Label(self.model_info_frame, text=price_text, foreground="blue").grid(row=1, column=0, sticky=tk.W)
        
        # 描述信息
        ttk.Label(self.model_info_frame, text=model_info['description'], foreground="gray").grid(row=2, column=0, sticky=tk.W)
        
        # 成本估算提示
        provider = model_info.get('provider', 'openai')
        if model_key == "gpt-4":
            cost_warning = "⚠️ 注意：此模型成本较高，建议用于重要翻译"
            ttk.Label(self.model_info_frame, text=cost_warning, foreground="red").grid(row=3, column=0, sticky=tk.W)
        elif model_key == "gpt-4o-mini":
            cost_tip = "💡 OpenAI性价比最佳选择，适合日常大量翻译"
            ttk.Label(self.model_info_frame, text=cost_tip, foreground="green").grid(row=3, column=0, sticky=tk.W)
        elif provider == "deepseek":
            if "r1-0528" in model_key:
                cost_tip = "🚀 DeepSeek R1-0528推理模型，逻辑思维能力强"
                ttk.Label(self.model_info_frame, text=cost_tip, foreground="green").grid(row=3, column=0, sticky=tk.W)
            elif "v3-0324" in model_key:
                cost_tip = "🔥 DeepSeek V3-0324模型，性能强劲价格亲民"
                ttk.Label(self.model_info_frame, text=cost_tip, foreground="green").grid(row=3, column=0, sticky=tk.W)
            else:
                cost_tip = "💰 DeepSeek超高性价比，成本仅为GPT-4的1/100"
                ttk.Label(self.model_info_frame, text=cost_tip, foreground="green").grid(row=3, column=0, sticky=tk.W)
    
    def calculate_cost(self, input_tokens, output_tokens, model_key):
        """计算翻译成本"""
        model_info = self.ai_models[model_key]
        
        # 提取价格数字（简化处理）
        input_price_per_1m = float(model_info['input_price'].split('$')[1].split('/')[0])
        output_price_per_1m = float(model_info['output_price'].split('$')[1].split('/')[0])
        
        # 计算成本
        input_cost = (input_tokens / 1000000) * input_price_per_1m
        output_cost = (output_tokens / 1000000) * output_price_per_1m
        
        return input_cost + output_cost
    
    def update_cost_display(self):
        """更新成本显示"""
        self.cost_label.config(text=f"本次会话成本: ${self.estimated_cost:.4f}")
    
    def reset_cost_stats(self):
        """重置成本统计"""
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.estimated_cost = 0.0
        self.update_cost_display()
        self.append_result("📊 成本统计已重置", "timestamp")
    
    def translate_text(self):
        """翻译输入的文本"""
        text = self.input_text.get("1.0", tk.END).strip()
        if not text:
            messagebox.showwarning("警告", "请输入要翻译的文本")
            return
        
        # 检查API Key配置
        model_key = self.selected_model_var.get()
        model_info = self.ai_models[model_key]
        provider = model_info.get('provider', 'openai')
        
        if provider == "deepseek":
            if not self.deepseek_key_var.get().strip():
                messagebox.showerror("错误", "请先配置DeepSeek API Key")
                return
        else:
            if not self.openai_key_var.get().strip() or self.openai_key_var.get().startswith("sk-your-default"):
                messagebox.showerror("错误", "请先配置有效的OpenAI API Key")
                return
        
        # 检查是否需要清空结果
        if self.result_mode_var.get() == "clear":
            self.clear_results()
        
        try:
            # 检测语言
            detected_lang = self.detect_language(text)
            
            # 根据模式决定是否翻译
            if not self.should_translate(detected_lang):
                self.append_result(f"🌐 检测到{detected_lang}，根据当前模式不进行翻译", "timestamp")
                self.append_result(f"原文: {text}", "original")
                return
            
            # 执行翻译
            translation, usage_info = self.perform_translation(text, detected_lang)
            
            # 更新成本统计
            if usage_info:
                input_tokens = usage_info.get('prompt_tokens', 0)
                output_tokens = usage_info.get('completion_tokens', 0)
                
                self.total_input_tokens += input_tokens
                self.total_output_tokens += output_tokens
                
                cost = self.calculate_cost(input_tokens, output_tokens, self.selected_model_var.get())
                self.estimated_cost += cost
                self.update_cost_display()
                
                # 显示本次翻译成本
                cost_info = f"本次成本: ${cost:.4f} (输入:{input_tokens} 输出:{output_tokens} tokens)"
                self.append_result(cost_info, "cost")
            
            # 显示结果
            timestamp = datetime.now().strftime("%H:%M:%S")
            model_name = self.ai_models[self.selected_model_var.get()]['name']
            self.append_result(f"[{timestamp}] 🎯 翻译完成 ({model_name})", "timestamp")
            self.append_result(f"原文 ({detected_lang}): {text}", "original")
            self.append_result(f"译文 ({self.target_lang_var.get()}): {translation}", "translation")
            self.append_result("=" * 50, "timestamp")
            
        except Exception as e:
            messagebox.showerror("错误", f"翻译失败: {e}")
    
    def batch_translate(self):
        """批量翻译功能"""
        text = self.input_text.get("1.0", tk.END).strip()
        if not text:
            messagebox.showwarning("警告", "请输入要翻译的文本")
            return
        
        # 按行分割文本
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        if len(lines) <= 1:
            # 如果只有一行，使用普通翻译
            self.translate_text()
            return
        
        # 确认批量翻译
        if not messagebox.askyesno("确认", f"将翻译 {len(lines)} 行文本，可能产生较高费用。是否继续？"):
            return
        
        # 检查是否需要清空结果
        if self.result_mode_var.get() == "clear":
            self.clear_results()
        
        self.append_result(f"🚀 开始批量翻译 {len(lines)} 行文本...", "timestamp")
        
        total_cost = 0.0
        for i, line in enumerate(lines, 1):
            try:
                detected_lang = self.detect_language(line)
                if self.should_translate(detected_lang):
                    translation, usage_info = self.perform_translation(line, detected_lang)
                    
                    # 计算成本
                    if usage_info:
                        input_tokens = usage_info.get('prompt_tokens', 0)
                        output_tokens = usage_info.get('completion_tokens', 0)
                        cost = self.calculate_cost(input_tokens, output_tokens, self.selected_model_var.get())
                        total_cost += cost
                        
                        self.total_input_tokens += input_tokens
                        self.total_output_tokens += output_tokens
                        self.estimated_cost += cost
                    
                    self.append_result(f"[{i}/{len(lines)}] {line} → {translation}", "translation")
                else:
                    self.append_result(f"[{i}/{len(lines)}] {line} (跳过翻译)", "original")
                    
                # 避免API限制，添加小延迟
                time.sleep(0.5)
                
            except Exception as e:
                self.append_result(f"[{i}/{len(lines)}] 翻译失败: {e}", "timestamp")
        
        self.update_cost_display()
        self.append_result(f"✅ 批量翻译完成，本次总成本: ${total_cost:.4f}", "cost")
    
    def detect_language(self, text):
        """检测文本语言"""
        if self.source_lang_var.get() != "auto":
            return self.source_lang_var.get()
        
        # 简单的语言检测
        hiragana_katakana = re.findall(r'[\u3040-\u309F\u30A0-\u30FF]', text)
        chinese_chars = re.findall(r'[\u4E00-\u9FAF]', text)
        
        if hiragana_katakana:
            return "ja"
        elif chinese_chars and not hiragana_katakana:
            return "zh"
        elif re.findall(r'[a-zA-Z]', text):
            return "en"
        else:
            return "unknown"
    
    def should_translate(self, detected_lang):
        """根据翻译模式判断是否应该翻译"""
        mode = self.translation_mode_var.get()
        
        if mode == "japanese_only":
            return detected_lang == "ja"
        elif mode == "chinese_only":
            return detected_lang == "zh"
        else:  # auto mode
            return True
    
    def perform_translation(self, text, source_lang):
        """执行翻译"""
        # 使用术语词典预处理文本
        processed_text, replacements = self.preprocess_text_with_terms(text)
        
        # 如果有术语替换，显示预处理信息
        if replacements:
            self.append_result(f"📚 术语预处理: {', '.join(replacements)}", "timestamp")
        
        # 构建翻译提示
        lang_names = {
            'ja': '日语',
            'zh': '中文',
            'en': '英语'
        }
        
        source_name = lang_names.get(source_lang, source_lang)
        target_name = lang_names.get(self.target_lang_var.get(), self.target_lang_var.get())
        
        # 根据质量增强模式调整提示
        if self.quality_enhance_var.get():
            prompt = f"""请将以下{source_name}文本翻译成{target_name}：

原文：{processed_text}

要求：
1. 保持原意准确，特别注意专有名词和公司名称
2. 语言自然流畅，符合{target_name}表达习惯
3. 保持原文的语气和敬语程度
4. 对于专业术语要准确翻译
5. 语气词要自然转换，避免直译
6. 只返回翻译结果，不要添加任何解释

注意：
- 已预处理的专有名词请保持不变
- 技术术语要准确理解语境
- 商务敬语要自然转换"""
        else:
            prompt = f"""请将以下{source_name}文本翻译成{target_name}：

原文：{processed_text}

要求：
1. 保持原意准确
2. 语言自然流畅
3. 已预处理的专有名词请保持不变
4. 只返回翻译结果，不要添加任何解释"""

        messages = [
            {"role": "system", "content": "你是专业的翻译助手，提供准确、自然的翻译。"},
            {"role": "user", "content": prompt}
        ]
        
        # 获取模型信息
        model_key = self.selected_model_var.get()
        model_info = self.ai_models[model_key]
        provider = model_info.get('provider', 'openai')
        
        # 获取实际API调用时使用的模型名称
        api_model_name = model_info.get('api_model', model_key)
        
        if OPENAI_V1:
            # 质量增强模式使用更低的温度和更多token
            if self.quality_enhance_var.get():
                temperature = 0.1
                max_tokens = 800
                system_content = "你是专业的日中翻译专家，特别擅长商务日语翻译，对日本企业文化和专业术语有深入理解。"
            else:
                temperature = 0.3
                max_tokens = 500
                system_content = "你是专业的翻译助手，提供准确、自然的翻译。"
            
            messages = [
                {"role": "system", "content": system_content},
                {"role": "user", "content": prompt}
            ]
            
            if provider == "deepseek":
                # 使用DeepSeek API
                api_key = self.deepseek_key_var.get()
                if not api_key.strip():
                    raise Exception("请先配置DeepSeek API Key")
                
                client = OpenAI(
                    api_key=api_key,
                    base_url="https://api.deepseek.com"
                )
            else:
                # 使用OpenAI API
                api_key = self.openai_key_var.get()
                if not api_key.strip() or api_key.startswith("sk-your-default"):
                    raise Exception("请先配置有效的OpenAI API Key")
                
                # 指定代理域名，避免直接访问官方域名受限
                client = OpenAI(api_key=api_key, base_url="https://api.openai-proxy.com/v1")
            
            response = client.chat.completions.create(
                model=api_model_name,  # 使用实际的API模型名称
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            translation = response.choices[0].message.content.strip()
            usage_info = response.usage.__dict__ if response.usage else {}
        else:
            # 使用旧版本OpenAI库 (v0.x)
            openai.api_key = self.openai_key_var.get()
            # 使用代理域名
            openai.api_base = "https://api.openai-proxy.com/v1"
            response = openai.ChatCompletion.create(
                model=self.selected_model_var.get(),
                messages=messages,
                max_tokens=500,
                temperature=0.3
            )
            translation = response.choices[0].message.content.strip()
            usage_info = response.get('usage', {})
        
        return translation, usage_info
    
    def clear_input(self):
        """清空输入框"""
        self.input_text.delete("1.0", tk.END)
    
    def append_result(self, text, tag=None):
        """添加结果文本"""
        self.result_text.insert(tk.END, text + "\n", tag)
        self.result_text.see(tk.END)
    
    def run(self):
        """运行应用"""
        # 程序关闭时停止剪贴板监听
        def on_closing():
            self.is_running = False
            self.root.destroy()
        
        self.root.protocol("WM_DELETE_WINDOW", on_closing)
        self.root.mainloop()

# 术语词典编辑器窗口
class TermsEditorWindow:
    """术语词典编辑器"""
    
    def __init__(self, parent, current_terms, update_callback):
        self.window = tk.Toplevel(parent)
        self.window.title("术语词典编辑器")
        self.window.geometry("700x500")
        self.window.transient(parent)
        
        self.current_terms = current_terms.copy()
        self.update_callback = update_callback
        
        self.create_widgets()
        self.load_terms()
    
    def create_widgets(self):
        """创建界面组件"""
        main_frame = ttk.Frame(self.window, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 标题和说明
        ttk.Label(main_frame, text="自定义术语词典", font=("Arial", 14, "bold")).pack(pady=(0, 10))
        
        info_text = """
💡 使用说明：
• 左侧输入日语原文，右侧输入正确翻译
• 支持专有名词、公司名称、技术术语等
• 翻译时会自动替换匹配的术语
• 有助于提高转录错误文本的翻译准确性
        """
        ttk.Label(main_frame, text=info_text, justify=tk.LEFT, foreground="blue").pack(anchor=tk.W, pady=(0, 15))
        
        # 术语列表框架
        list_frame = ttk.LabelFrame(main_frame, text="术语列表", padding="10")
        list_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        # 创建表格
        columns = ("日语原文", "正确翻译", "操作")
        self.tree = ttk.Treeview(list_frame, columns=columns, show="headings", height=12)
        
        # 设置列标题和宽度
        self.tree.heading("日语原文", text="日语原文")
        self.tree.heading("正确翻译", text="正确翻译")
        self.tree.heading("操作", text="操作")
        
        self.tree.column("日语原文", width=200)
        self.tree.column("正确翻译", width=200)
        self.tree.column("操作", width=100)
        
        # 添加滚动条
        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # 双击编辑
        self.tree.bind("<Double-1>", self.edit_term)
        
        # 添加新术语框架
        add_frame = ttk.LabelFrame(main_frame, text="添加新术语", padding="10")
        add_frame.pack(fill=tk.X, pady=(0, 10))
        
        # 输入框
        ttk.Label(add_frame, text="日语原文:").grid(row=0, column=0, sticky=tk.W, padx=5)
        self.japanese_entry = ttk.Entry(add_frame, width=30)
        self.japanese_entry.grid(row=0, column=1, padx=5, sticky=(tk.W, tk.E))
        
        ttk.Label(add_frame, text="正确翻译:").grid(row=0, column=2, sticky=tk.W, padx=5)
        self.translation_entry = ttk.Entry(add_frame, width=30)
        self.translation_entry.grid(row=0, column=3, padx=5, sticky=(tk.W, tk.E))
        
        ttk.Button(add_frame, text="添加", command=self.add_term).grid(row=0, column=4, padx=5)
        
        # 配置网格权重
        add_frame.columnconfigure(1, weight=1)
        add_frame.columnconfigure(3, weight=1)
        
        # 按钮框架
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(button_frame, text="删除选中", command=self.delete_term).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="导入预设", command=self.import_presets).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="保存", command=self.save_terms).pack(side=tk.RIGHT, padx=5)
        ttk.Button(button_frame, text="取消", command=self.window.destroy).pack(side=tk.RIGHT, padx=5)
    
    def load_terms(self):
        """加载术语到表格"""
        # 清空现有项目
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        # 添加术语
        for japanese, translation in self.current_terms.items():
            self.tree.insert("", tk.END, values=(japanese, translation, "双击编辑"))
    
    def add_term(self):
        """添加新术语"""
        japanese = self.japanese_entry.get().strip()
        translation = self.translation_entry.get().strip()
        
        if not japanese or not translation:
            messagebox.showwarning("警告", "请输入日语原文和正确翻译")
            return
        
        self.current_terms[japanese] = translation
        self.load_terms()
        
        # 清空输入框
        self.japanese_entry.delete(0, tk.END)
        self.translation_entry.delete(0, tk.END)
        
        messagebox.showinfo("成功", f"已添加术语: {japanese} → {translation}")
    
    def edit_term(self, event):
        """编辑术语"""
        selection = self.tree.selection()
        if not selection:
            return
        
        item = selection[0]
        values = self.tree.item(item, "values")
        japanese, translation = values[0], values[1]
        
        # 创建编辑对话框
        edit_window = tk.Toplevel(self.window)
        edit_window.title("编辑术语")
        edit_window.geometry("400x150")
        edit_window.transient(self.window)
        
        frame = ttk.Frame(edit_window, padding="20")
        frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(frame, text="日语原文:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        japanese_var = tk.StringVar(value=japanese)
        japanese_edit = ttk.Entry(frame, textvariable=japanese_var, width=30)
        japanese_edit.grid(row=0, column=1, padx=5, pady=5)
        
        ttk.Label(frame, text="正确翻译:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        translation_var = tk.StringVar(value=translation)
        translation_edit = ttk.Entry(frame, textvariable=translation_var, width=30)
        translation_edit.grid(row=1, column=1, padx=5, pady=5)
        
        def save_edit():
            new_japanese = japanese_var.get().strip()
            new_translation = translation_var.get().strip()
            
            if not new_japanese or not new_translation:
                messagebox.showwarning("警告", "请输入完整信息")
                return
            
            # 删除旧术语
            if japanese in self.current_terms:
                del self.current_terms[japanese]
            
            # 添加新术语
            self.current_terms[new_japanese] = new_translation
            self.load_terms()
            edit_window.destroy()
        
        button_frame = ttk.Frame(frame)
        button_frame.grid(row=2, column=0, columnspan=2, pady=10)
        
        ttk.Button(button_frame, text="保存", command=save_edit).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="取消", command=edit_window.destroy).pack(side=tk.LEFT, padx=5)
    
    def delete_term(self):
        """删除选中的术语"""
        selection = self.tree.selection()
        if not selection:
            messagebox.showwarning("警告", "请选择要删除的术语")
            return
        
        item = selection[0]
        values = self.tree.item(item, "values")
        japanese = values[0]
        
        if messagebox.askyesno("确认", f"确定要删除术语 '{japanese}' 吗？"):
            if japanese in self.current_terms:
                del self.current_terms[japanese]
            self.load_terms()
    
    def import_presets(self):
        """导入预设术语"""
        presets = {
            "アーバンも": "Avamo",
            "アバモ": "Avamo",
            "エアテレント": "AI Talent", 
            "ホリプロ": "Horipro",
            "クリエイティブチェック": "创意审核",
            "アバター": "虚拟形象",
            "タレント": "艺人",
            "ネイティブチェック": "母语审核",
            "アイドル": "偶像",
            "アニメキャラ": "动画角色",
            "ビジネスモード": "商业模式",
            "デベロップメント": "开发",
            "アカウント": "账户",
            "クリエイティブ": "创意",
            "チェック": "审核",
            "コンテンツ": "内容",
            "プラットフォーム": "平台"
        }
        
        added_count = 0
        for japanese, translation in presets.items():
            if japanese not in self.current_terms:
                self.current_terms[japanese] = translation
                added_count += 1
        
        self.load_terms()
        messagebox.showinfo("成功", f"已导入 {added_count} 个预设术语")
    
    def save_terms(self):
        """保存术语词典"""
        self.update_callback(self.current_terms)
        messagebox.showinfo("成功", f"术语词典已保存，共 {len(self.current_terms)} 个术语")
        self.window.destroy()

# 模型对比窗口
class ModelComparisonWindow:
    """模型对比窗口"""
    
    def __init__(self, parent, models_data):
        self.window = tk.Toplevel(parent)
        self.window.title("AI模型对比")
        self.window.geometry("900x700")
        self.window.transient(parent)
        
        # 创建对比表格
        main_frame = ttk.Frame(self.window, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 标题
        ttk.Label(main_frame, text="AI模型价格对比", font=("Arial", 14, "bold")).pack(pady=(0, 20))
        
        # 创建表格
        columns = ("模型", "提供商", "输入价格", "输出价格", "描述", "推荐")
        tree = ttk.Treeview(main_frame, columns=columns, show="headings", height=15)
        
        # 设置列标题和宽度
        tree.heading("模型", text="模型")
        tree.heading("提供商", text="提供商")
        tree.heading("输入价格", text="输入价格")
        tree.heading("输出价格", text="输出价格")
        tree.heading("描述", text="描述")
        tree.heading("推荐", text="推荐")
        
        tree.column("模型", width=180)
        tree.column("提供商", width=80)
        tree.column("输入价格", width=120)
        tree.column("输出价格", width=120)
        tree.column("描述", width=250)
        tree.column("推荐", width=60)
        
        # 添加数据
        for model_key, model_info in models_data.items():
            recommended = "⭐ 是" if model_info.get('recommended') else "否"
            provider = model_info.get('provider', 'openai').upper()
            tree.insert("", tk.END, values=(
                model_info['name'],
                provider,
                model_info['input_price'],
                model_info['output_price'],
                model_info['description'],
                recommended
            ))
        
        tree.pack(fill=tk.BOTH, expand=True, pady=(0, 20))
        
        # 使用建议
        advice_text = """
💡 使用建议：

🚀 DeepSeek R1-0528: 最新推理模型，逻辑思维能力强 (推荐)
🔥 DeepSeek V3-0324: V3最新版本，性能强劲价格亲民
🏆 GPT-4o Mini: OpenAI性价比最佳，适合日常大量翻译
🚀 GPT-4o: OpenAI最新最强，重要会议推荐使用  
⚠️ GPT-4: 质量好但昂贵，谨慎使用

📊 成本估算（1000字翻译）：
- DeepSeek R1-0528: ~$0.01
- DeepSeek V3-0324: ~$0.005
- GPT-4o Mini: ~$0.01
- GPT-4o: ~$0.08  
- GPT-3.5 Turbo: ~$0.003
- GPT-4: ~$0.15

🎯 推荐组合：
- 复杂翻译: DeepSeek R1-0528
- 日常翻译: DeepSeek V3-0324
- 重要会议: GPT-4o
        """
        
        advice_label = ttk.Label(main_frame, text=advice_text, justify=tk.LEFT, foreground="blue")
        advice_label.pack(anchor=tk.W)
        
        # 关闭按钮
        ttk.Button(main_frame, text="关闭", command=self.window.destroy).pack(pady=10)

# 使用说明窗口（更新版）
class UsageGuideWindow:
    """使用说明窗口"""
    
    def __init__(self, parent):
        self.window = tk.Toplevel(parent)
        self.window.title("使用说明")
        self.window.geometry("700x600")
        self.window.transient(parent)
        
        # 创建说明文本
        text_frame = ttk.Frame(self.window, padding="20")
        text_frame.pack(fill=tk.BOTH, expand=True)
        
        guide_text = scrolledtext.ScrolledText(text_frame, wrap=tk.WORD)
        guide_text.pack(fill=tk.BOTH, expand=True)
        
        usage_content = """
Teams简化版实时翻译助手 v2.1 使用说明

🎯 新增功能：
✅ 默认API Key设置
✅ 剪贴板监听自动翻译
✅ 更大的输入和结果窗口
✅ 翻译结果追加/清空模式
✅ 粘贴翻译快捷功能

📋 剪贴板监听功能：
🔥 启用后，在Teams中复制文本将自动翻译
🔥 可选择是否自动复制翻译结果到剪贴板
🔥 支持实时监听，避免翻译循环
🔥 智能过滤：跳过API Key、过短文本等

🔧 配置步骤：
1. 设置默认API Key：
   - 在代码中修改 default_api_key 变量
   - 或在界面中输入API Key

2. 启用剪贴板监听：
   - 勾选"剪贴板监听翻译"
   - 可选勾选"自动复制结果"（避免翻译循环）
   - 在Teams中复制文本即可自动翻译

🚀 使用方法：
1. 自动翻译（推荐）：
   - 启用剪贴板监听
   - 在Teams中复制日语文本
   - 自动翻译并复制结果
   - 粘贴到Teams聊天

2. 手动翻译：
   - 输入或粘贴文本
   - 点击"翻译文本"
   - 查看翻译结果

3. 批量翻译：
   - 输入多行文本
   - 点击"批量翻译"
   - 逐行翻译显示

💡 使用技巧：
- 选择"追加显示"保留历史翻译
- 选择"清空显示"只显示当前翻译
- 使用"粘贴翻译"快速处理剪贴板内容
- 设置翻译模式为"japanese_only"只翻译日语

⚠️ 注意事项：
- 剪贴板监听需要有效的API Key
- 建议使用GPT-4o Mini控制成本
- 可选择是否自动复制翻译结果
- 系统会智能过滤，避免翻译循环
        """
        
        guide_text.insert("1.0", usage_content)
        guide_text.config(state=tk.DISABLED)
        
        # 关闭按钮
        ttk.Button(text_frame, text="关闭", command=self.window.destroy).pack(pady=10)

def main():
    """主函数"""
    app = SimplifiedTeamsTranslator()
    
    # 显示使用说明
    def show_guide():
        UsageGuideWindow(app.root)
    
    # 显示模型对比
    def show_model_comparison():
        ModelComparisonWindow(app.root, app.ai_models)
    
    # 添加菜单
    menubar = tk.Menu(app.root)
    app.root.config(menu=menubar)
    
    help_menu = tk.Menu(menubar, tearoff=0)
    menubar.add_cascade(label="帮助", menu=help_menu)
    help_menu.add_command(label="使用说明", command=show_guide)
    help_menu.add_command(label="模型对比", command=show_model_comparison)
    
    app.run()

if __name__ == "__main__":
    main() 