/**
 * ErrorHandler.js
 * Centralized error handling and recovery
 */

/**
 * Custom error types
 */
export class AudioSystemError extends Error {
  constructor(message, code = 'AUDIO_ERROR', details = {}) {
    super(message);
    this.name = 'AudioSystemError';
    this.code = code;
    this.details = details;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class InitializationError extends AudioSystemError {
  constructor(message, details = {}) {
    super(message, 'INIT_ERROR', details);
    this.name = 'InitializationError';
  }
}

export class AudioContextError extends AudioSystemError {
  constructor(message, details = {}) {
    super(message, 'CONTEXT_ERROR', details);
    this.name = 'AudioContextError';
  }
}

export class ResourceError extends AudioSystemError {
  constructor(message, details = {}) {
    super(message, 'RESOURCE_ERROR', details);
    this.name = 'ResourceError';
  }
}

export class GeneratorError extends AudioSystemError {
  constructor(message, details = {}) {
    super(message, 'GENERATOR_ERROR', details);
    this.name = 'GeneratorError';
  }
}

export class ConnectionError extends AudioSystemError {
  constructor(message, details = {}) {
    super(message, 'CONNECTION_ERROR', details);
    this.name = 'ConnectionError';
  }
}

export class ParameterError extends AudioSystemError {
  constructor(message, details = {}) {
    super(message, 'PARAMETER_ERROR', details);
    this.name = 'ParameterError';
  }
}

/**
 * Global error handler
 */
export class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      logToConsole: options.logToConsole !== false,
      rethrow: options.rethrow !== false,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      onError: options.onError || null
    };
    
    this.errorLog = [];
    this.retryMap = new Map(); // Map of function => retry count
  }

  /**
   * Log an error
   * @param {Error} error - The error to log
   * @param {Object} context - Additional context information
   */
  logError(error, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      },
      context
    };
    
    this.errorLog.push(logEntry);
    
    if (this.options.logToConsole) {
      console.error('[AudioSystem]', timestamp, error.name, error.message, context, error);
    }
    
    if (this.options.onError && typeof this.options.onError === 'function') {
      try {
        this.options.onError(error, context);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    }
    
    return logEntry;
  }

  /**
   * Handle an error
   * @param {Error} error - The error to handle
   * @param {Object} context - Additional context information
   * @param {boolean} [shouldRethrow=null] - Whether to rethrow the error (overrides options)
   * @returns {Object} The error log entry
   * @throws {Error} Rethrows the error if specified
   */
  handleError(error, context = {}, shouldRethrow = null) {
    const logEntry = this.logError(error, context);
    
    if (shouldRethrow === true || (shouldRethrow === null && this.options.rethrow)) {
      throw error;
    }
    
    return logEntry;
  }

  /**
   * Get the most recent errors
   * @param {number} count - Number of errors to retrieve
   * @returns {Array<Object>} Array of error log entries
   */
  getRecentErrors(count = 10) {
    return this.errorLog.slice(-count);
  }

  /**
   * Wrap a function with error handling
   * @param {Function} fn - Function to wrap
   * @param {Object} context - Context information to include in error logs
   * @param {Object} options - Options for error handling
   * @returns {Function} Wrapped function
   */
  wrapFunction(fn, context = {}, options = {}) {
    const handler = this;
    const opts = { ...this.options, ...options };
    
    return async function wrapped(...args) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        handler.logError(error, { 
          ...context, 
          args: args.map(arg => {
            // Try to create a simplified version of the args for logging
            try {
              return typeof arg === 'object' ? JSON.stringify(arg) : arg;
            } catch (e) {
              return typeof arg;
            }
          })
        });
        
        if (opts.rethrow) {
          throw error;
        }
        
        return null;
      }
    };
  }

  /**
   * Retry a function if it fails
   * @param {Function} fn - Function to retry
   * @param {Object} context - Context information to include in error logs
   * @param {Object} options - Options for retry behavior
   * @returns {Promise<any>} Result of the function
   */
  async retry(fn, context = {}, options = {}) {
    const opts = { 
      maxRetries: options.maxRetries || this.options.maxRetries,
      retryDelay: options.retryDelay || this.options.retryDelay,
      onRetry: options.onRetry || null,
      retryableErrors: options.retryableErrors || null // List of error codes to retry
    };
    
    let lastError;
    let attempt = 0;
    
    const performAttempt = async () => {
      attempt++;
      
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // If we have a list of retryable errors, check if this is one
        if (opts.retryableErrors && Array.isArray(opts.retryableErrors)) {
          if (!opts.retryableErrors.includes(error.code)) {
            this.logError(error, { ...context, attempt, retryDecision: 'error not retryable' });
            throw error;
          }
        }
        
        // Check if we've reached max retries
        if (attempt >= opts.maxRetries) {
          this.logError(error, { ...context, attempt, retryDecision: 'max retries reached' });
          throw error;
        }
        
        // Log the retry
        this.logError(error, { ...context, attempt, retryDecision: 'retrying' });
        
        // Call onRetry callback if provided
        if (opts.onRetry && typeof opts.onRetry === 'function') {
          try {
            opts.onRetry(error, attempt);
          } catch (callbackError) {
            console.error('Error in retry callback:', callbackError);
          }
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, opts.retryDelay));
        
        // Retry
        return performAttempt();
      }
    };
    
    return performAttempt();
  }

  /**
   * Create an error from a string or error-like object
   * @param {string|Object} error - Error message or object
   * @param {string} [code] - Error code
   * @param {Object} [details] - Additional error details
   * @returns {AudioSystemError} Properly formatted error
   */
  createError(error, code = 'AUDIO_ERROR', details = {}) {
    if (error instanceof Error) {
      // If it's already an Error, just ensure it has our properties
      if (!(error instanceof AudioSystemError)) {
        const systemError = new AudioSystemError(error.message, code, details);
        systemError.stack = error.stack;
        return systemError;
      }
      return error;
    }
    
    if (typeof error === 'string') {
      return new AudioSystemError(error, code, details);
    }
    
    return new AudioSystemError(
      error?.message || 'Unknown error',
      error?.code || code,
      { ...details, ...(error?.details || {}) }
    );
  }
  
  /**
   * Clear the error log
   */
  clearLog() {
    this.errorLog = [];
  }
}

/**
 * Create a default error handler instance
 */
const defaultHandler = new ErrorHandler();

/**
 * Export error types and handler
 */
export default {
  AudioSystemError,
  InitializationError,
  AudioContextError,
  ResourceError,
  GeneratorError,
  ConnectionError,
  ParameterError,
  ErrorHandler,
  defaultHandler
}; 