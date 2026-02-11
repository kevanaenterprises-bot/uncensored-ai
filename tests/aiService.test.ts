// tests/aiService.test.ts

import { AIService, createAIService } from '../lib/aiService';
import { 
  InvalidResponseError, 
  ServiceUnavailableError, 
  ConfigurationError 
} from '../lib/aiServiceErrors';

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

      it('should use VENICE_MODEL environment variable when model not specified in config', () => {
        process.env.VENICE_MODEL = 'llama-3.2-3b';
        const service = new AIService({
          provider: 'venice',
          apiKey: 'test-venice-key',
        });

        expect(service.getModel()).toBe('llama-3.2-3b');
      });

      it('should use llama-3.3-70b as default when neither config nor env model specified', () => {
        delete process.env.VENICE_MODEL;
        const service = new AIService({
          provider: 'venice',
          apiKey: 'test-venice-key',
        });

        expect(service.getModel()).toBe('llama-3.3-70b');
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
      it('should throw ServiceUnavailableError on API failure', async () => {
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
          ServiceUnavailableError
        );
      });

      it('should include error details in ServiceUnavailableError', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          json: async () => ({ error: 'Quota exceeded' }),
        });

        const service = new AIService({
          provider: 'openai',
          apiKey: 'test-key',
        });

        try {
          await service.generateCompletion('Test prompt');
          fail('Should have thrown ServiceUnavailableError');
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceUnavailableError);
          if (error instanceof ServiceUnavailableError) {
            expect(error.statusCode).toBe(403);
            expect(error.statusText).toBe('Forbidden');
            expect(error.provider).toBe('openai');
          }
        }
      });

      it('should throw InvalidResponseError on invalid response structure', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ choices: [] }), // Empty choices array
        });

        const service = new AIService({
          provider: 'venice',
          apiKey: 'test-key',
        });

        await expect(service.generateCompletion('Test prompt')).rejects.toThrow(
          InvalidResponseError
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
          ServiceUnavailableError
        );
      });

      it('should handle missing message or content in response', async () => {
        const mockResponse = {
          choices: [
            {
              message: {}, // Missing content
            },
          ],
          usage: {
            total_tokens: 10,
          },
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const service = new AIService({
          provider: 'venice',
          apiKey: 'test-key',
        });

        const result = await service.generateCompletion('Test prompt');
        
        // Should return empty string when content is missing
        expect(result.content).toBe('');
        expect(result.tokensUsed).toBe(10);
      });

      it('should handle missing usage field in response', async () => {
        const mockResponse = {
          choices: [
            {
              message: {
                content: 'Response with no usage data',
              },
            },
          ],
          // Missing usage field
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const service = new AIService({
          provider: 'openai',
          apiKey: 'test-key',
        });

        const result = await service.generateCompletion('Test prompt');
        
        expect(result.content).toBe('Response with no usage data');
        // Should default to 0 when usage is missing
        expect(result.tokensUsed).toBe(0);
      });

      it('should handle undefined total_tokens in usage', async () => {
        const mockResponse = {
          choices: [
            {
              message: {
                content: 'Test response',
              },
            },
          ],
          usage: {}, // usage exists but total_tokens is missing
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const service = new AIService({
          provider: 'venice',
          apiKey: 'test-key',
        });

        const result = await service.generateCompletion('Test prompt');
        
        expect(result.content).toBe('Test response');
        expect(result.tokensUsed).toBe(0);
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

    it('should throw ConfigurationError for invalid provider', () => {
      process.env.AI_PROVIDER = 'invalid-provider';
      process.env.VENICE_API_KEY = 'test-key';

      expect(() => createAIService()).toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError if Venice API key is missing', () => {
      process.env.AI_PROVIDER = 'venice';

      expect(() => createAIService()).toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError if OpenAI API key is missing', () => {
      process.env.AI_PROVIDER = 'openai';

      expect(() => createAIService()).toThrow(ConfigurationError);
    });
  });
});
