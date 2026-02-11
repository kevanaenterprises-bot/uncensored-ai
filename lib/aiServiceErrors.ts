// lib/aiServiceErrors.ts

export class AIServiceError extends Error {
  constructor(message: string, public provider: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class InvalidResponseError extends AIServiceError {
  constructor(provider: string, details?: string) {
    super(
      details 
        ? `Invalid response structure from ${provider} API: ${details}`
        : `Invalid response structure from ${provider} API`,
      provider
    );
    this.name = 'InvalidResponseError';
  }
}

export class ServiceUnavailableError extends AIServiceError {
  constructor(provider: string, public statusCode: number, public statusText: string) {
    super(
      `Failed to generate response from ${provider}: ${statusCode} ${statusText}`,
      provider
    );
    this.name = 'ServiceUnavailableError';
  }
}

export class ConfigurationError extends AIServiceError {
  constructor(message: string) {
    super(message, 'configuration');
    this.name = 'ConfigurationError';
  }
}
