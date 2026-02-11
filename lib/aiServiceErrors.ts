// lib/aiServiceErrors.ts

// Note: Object.setPrototypeOf is necessary for proper instanceof checks when extending Error
// This is the official TypeScript/MDN recommended approach for ES5/ES6 compatibility
// See: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#support-for-newtarget

export class AIServiceError extends Error {
  constructor(message: string, public provider: string) {
    super(message);
    this.name = 'AIServiceError';
    Object.setPrototypeOf(this, new.target.prototype);
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
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ServiceUnavailableError extends AIServiceError {
  constructor(provider: string, public statusCode: number, public statusText: string) {
    super(
      `Failed to generate response from ${provider}: ${statusCode} ${statusText}`,
      provider
    );
    this.name = 'ServiceUnavailableError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConfigurationError extends AIServiceError {
  constructor(message: string) {
    super(message, 'configuration');
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
