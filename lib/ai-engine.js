/**
 * Yerel AI Motoru (WebGPU / WebAssembly & Transformers.js Pipeline)
 * 'wasm-unsafe-eval' ve Güçlendirilmiş WASM/WebGPU Yürütücüsü
 */
import { MODELS_CATALOG, SUMMARY_PROMPTS } from '/lib/models-catalog.js';

class LocalAIEngine {
  constructor() {
    this.pipeline = null;
    this.currentModelId = null;
    this.isLoading = false;
    this.transformers = null;
  }

  async loadTransformersLibrary() {
    if (this.transformers) return this.transformers;

    try {
      let tfModule = null;
      try {
        const localPath = chrome.runtime.getURL('lib/transformers.min.js');
        tfModule = await import(localPath);
      } catch (e1) {
        tfModule = await import('./transformers.min.js');
      }

      this.transformers = tfModule.default || tfModule;

      if (this.transformers.env) {
        this.transformers.env.allowLocalModels = false;
        this.transformers.env.useBrowserCache = true;
        
        const wasmDir = chrome.runtime.getURL('lib/');
        if (this.transformers.env.backends?.onnx?.wasm) {
          this.transformers.env.backends.onnx.wasm.wasmPaths = wasmDir;
          this.transformers.env.backends.onnx.wasm.numThreads = 1;
        }
      }

      return this.transformers;
    } catch (err) {
      console.error("Transformers.js başlatma hatası:", err);
      throw new Error("Yapay zeka motoru başlatılamadı: " + (err.message || err));
    }
  }

  async initModel(modelConfig, progressCallback = null) {
    if (this.pipeline && this.currentModelId === modelConfig.id) {
      return this.pipeline;
    }

    await this.dispose();

    this.isLoading = true;
    const tf = await this.loadTransformersLibrary();

    // 1. Önce WebGPU ile dene
    try {
      const pipelineOptions = {
        device: 'webgpu',
        dtype: modelConfig.dtype || 'q4',
        progress_callback: (progress) => {
          if (progressCallback) progressCallback(progress);
        }
      };

      const task = modelConfig.task || 'text-generation';
      this.pipeline = await tf.pipeline(task, modelConfig.modelId, pipelineOptions);
      this.currentModelId = modelConfig.id;
      this.isLoading = false;
      return this.pipeline;
    } catch (webgpuError) {
      console.warn("WebGPU başlatılamadı, WASM moduna geçiliyor:", webgpuError);
      
      // 2. WebGPU başarısız olursa güvenli WASM moduna geç
      const wasmOptions = {
        device: 'wasm',
        dtype: modelConfig.dtype || 'q4',
        progress_callback: (progress) => {
          if (progressCallback) progressCallback(progress);
        }
      };

      const task = modelConfig.task || 'text-generation';
      this.pipeline = await tf.pipeline(task, modelConfig.modelId, wasmOptions);
      this.currentModelId = modelConfig.id;
      this.isLoading = false;
      return this.pipeline;
    }
  }

  async summarize(text, options = {}, onTokenStream = null, progressCallback = null) {
    const modelId = options.modelId || 'qwen-2.5-0.5b';
    const mode = options.mode || 'bullets';
    const modelConfig = MODELS_CATALOG.find(m => m.id === modelId) || MODELS_CATALOG[0];

    const pipe = await this.initModel(modelConfig, progressCallback);
    const trimmedText = text.length > 4500 ? text.slice(0, 4500) + "..." : text;

    const promptTemplate = SUMMARY_PROMPTS[mode] || SUMMARY_PROMPTS.bullets;
    const fullPrompt = promptTemplate.replace('{text}', trimmedText);

    const messages = [
      { role: 'system', content: 'Sen Türkçe haber ve metinleri özetleyen uzman bir yapay zeka asistanısın. Yanıtını anlaşılır ve akıcı Türkçe ver.' },
      { role: 'user', content: fullPrompt }
    ];

    let streamer = null;
    if (onTokenStream && this.transformers?.TextStreamer) {
      streamer = new this.transformers.TextStreamer(pipe.tokenizer, {
        skip_prompt: true,
        callback_function: (tokenText) => {
          onTokenStream(tokenText);
        }
      });
    }

    const output = await pipe(messages, {
      max_new_tokens: options.maxTokens || 240,
      temperature: 0.3,
      do_sample: false,
      streamer: streamer
    });

    const outputText = output[0]?.generated_text?.at(-1)?.content || output[0]?.generated_text || "";
    return outputText;
  }

  async dispose() {
    if (this.pipeline) {
      try {
        if (typeof this.pipeline.dispose === 'function') {
          await this.pipeline.dispose();
        }
      } catch (e) {
        console.log("Dispose:", e);
      }
      this.pipeline = null;
      this.currentModelId = null;
      this.isLoading = false;
    }
  }
}

export const aiEngine = new LocalAIEngine();