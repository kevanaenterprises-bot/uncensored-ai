// tests/aiService.test.ts

import { AIService, createAIService } from '../lib/aiService';

// Mock fetch globally
global.fetch = jest.fn();

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.AI_PROVIDER;
    delete process.env.VENICE_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.VENICE_MODEL;
  });

  describe('AIService class', () => {
    describe('Venice.ai provider', () => {
      it('should initialize with correct Venice.ai settings', () => {
        const service = new AIService({
          provider: 'venice',
          apiKey: 'test-venice-key',
          model: 'llama-3.3-70b',
        });

        expect(service.getProviderName()).toBe('venice');
        expect(service.getModel()).toBe('llama-3.3-70b');
      });

      it('should use default model if not specified', () => {
        process.env.VENICE_MODEL = 'llama-3.2-3b';
        const service = new AIService({
          provider: 'venice',
          apiKey: 'test-venice-key',
        });

        expect(service.getModel()).toBe('llama-3.2-3b');
      });

      it('should successfully generate completion with Venice.ai', async () => {
        const mockResponse = {
          choices: [
            {
              message: {
                content: 'Test response from Venice.ai',
              },
            },
          ],
          usage: {
            total_tokens: 50,
          },
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const service = new AIService({
          provider: 'venice',
          apiKey: 'test-venice-key',
        });

        const result = await service.generateCompletion('Test prompt', 100);

        expect(result.content).toBe('Test response from Venice.ai');
        expect(result.tokensUsed).toBe(50);
        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.venice.ai/api/v1/chat/completions',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-venice-key',
            }),
          })
        );
      });
    });

    describe('OpenAI provider', () => {
      it('should initialize with correct OpenAI settings', () => {
        const service = new AIService({
          provider: 'openai',
          apiKey: 'test-openai-key',
        });

        expect(service.getProviderName()).toBe('openai');
        expect(service.getModel()).toBe('gpt-3.5-turbo');
      });

      it('should successfully generate completion with OpenAI', async () => {
        const mockResponse = {
          choices: [
            {
              message: {
                content: 'Test response from OpenAI',
              },
            },
          ],
          usage: {
            total_tokens: 75,
          },
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const service = new AIService({
          provider: 'openai',
          apiKey: 'test-openai-key',
        });

        const result = await service.generateCompletion('Test prompt', 100);

        expect(result.content).toBe('Test response from OpenAI');
        expect(result.tokensUsed).toBe(75);
        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.openai.com/v1/chat/completions',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-openai-key',
            }),
          })
        );
      });
    });

    describe('Error handling', () => {
      it('should throw error on API failure', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ error: 'Invalid API key' }),
        });

        const service = new AIService({
          provider: 'venice',
          apiKey: 'invalid-key',
        });

        await expect(service.generateCompletion('Test prompt')).rejects.toThrow(
          'Failed to generate response from venice'
        );
      });

      it('should throw error on invalid response structure', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ choices: [] }), // Empty choices array
        });

        const service = new AIService({
          provider: 'venice',
          apiKey: 'test-key',
        });

        await expect(service.generateCompletion('Test prompt')).rejects.toThrow(
          'Invalid response structure from venice API'
        );
      });

      it('should handle JSON parse errors gracefully', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => {
            throw new Error('Parse error');
          },
        });

        const service = new AIService({
          provider: 'openai',
          apiKey: 'test-key',
        });

        await expect(service.generateCompletion('Test prompt')).rejects.toThrow(
          'Failed to generate response from openai: 500 Internal Server Error'
        );
      });
    });
  });

  describe('createAIService factory', () => {
    it('should create Venice.ai service when configured', () => {
      process.env.AI_PROVIDER = 'venice';
      process.env.VENICE_API_KEY = 'test-venice-key';

      const service = createAIService();

      expect(service.getProviderName()).toBe('venice');
    });

    it('should create OpenAI service when configured', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'test-openai-key';

      const service = createAIService();

      expect(service.getProviderName()).toBe('openai');
    });

    it('should default to Venice.ai if AI_PROVIDER not set', () => {
      process.env.VENICE_API_KEY = 'test-venice-key';

      const service = createAIService();

      expect(service.getProviderName()).toBe('venice');
    });

    it('should throw error for invalid provider', () => {
      process.env.AI_PROVIDER = 'invalid-provider';
      process.env.VENICE_API_KEY = 'test-key';

      expect(() => createAIService()).toThrow(
        "Invalid AI_PROVIDER: 'invalid-provider'. Must be 'openai' or 'venice'."
      );
    });

    it('should throw error if Venice API key is missing', () => {
      process.env.AI_PROVIDER = 'venice';

      expect(() => createAIService()).toThrow(
        'VENICE_API_KEY environment variable is required when using Venice.ai provider'
      );
    });

    it('should throw error if OpenAI API key is missing', () => {
      process.env.AI_PROVIDER = 'openai';

      expect(() => createAIService()).toThrow(
        'OPENAI_API_KEY environment variable is required when using OpenAI provider'
      );
    });
  });
});
