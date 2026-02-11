// lib/aiService.ts

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  content: string;
  tokensUsed: number;
}

interface AIServiceConfig {
  provider: 'openai' | 'venice';
  apiKey: string;
  model?: string;
}

export class AIService {
  private provider: 'openai' | 'venice';
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: AIServiceConfig) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    
    // Set base URL and default model based on provider
    if (this.provider === 'venice') {
      this.baseUrl = 'https://api.venice.ai/api/v1';
      this.model = config.model || process.env.VENICE_MODEL || 'llama-3.3-70b';
    } else {
      this.baseUrl = 'https://api.openai.com/v1';
      this.model = config.model || 'gpt-3.5-turbo';
    }
  }

  async generateCompletion(
    prompt: string,
    maxTokens: number = 1000
  ): Promise<AIResponse> {
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    const requestBody = {
      model: this.model,
      messages,
      max_tokens: maxTokens,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`${this.provider} API error:`, errorData);
        throw new Error(`Failed to generate response from ${this.provider}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;

      return {
        content,
        tokensUsed,
      };
    } catch (error) {
      console.error(`AI Service error (${this.provider}):`, error);
      throw error;
    }
  }

  getProviderName(): string {
    return this.provider;
  }

  getModel(): string {
    return this.model;
  }
}

// Factory function to create AI service based on environment config
export function createAIService(): AIService {
  const provider = (process.env.AI_PROVIDER || 'venice') as 'openai' | 'venice';
  
  let apiKey: string;
  let model: string | undefined;

  if (provider === 'venice') {
    apiKey = process.env.VENICE_API_KEY || '';
    model = process.env.VENICE_MODEL;
    
    if (!apiKey) {
      throw new Error('VENICE_API_KEY environment variable is required when using Venice.ai provider');
    }
  } else {
    apiKey = process.env.OPENAI_API_KEY || '';
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required when using OpenAI provider');
    }
  }

  return new AIService({ provider, apiKey, model });
}
