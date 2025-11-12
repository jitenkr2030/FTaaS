export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
  userMessage?: string
}

export class ErrorHandler {
  static createError(
    code: string,
    message: string,
    details?: any,
    userMessage?: string
  ): AppError {
    return {
      code,
      message,
      details,
      userMessage: userMessage || message,
      timestamp: new Date().toISOString()
    }
  }

  static isNetworkError(error: any): boolean {
    return (
      error instanceof TypeError &&
      (error.message.includes('Network Error') ||
        error.message.includes('fetch') ||
        error.message.includes('Failed to fetch'))
    )
  }

  static isAuthError(error: any): boolean {
    return (
      error?.status === 401 ||
      error?.code === 'UNAUTHORIZED' ||
      error?.message?.includes('unauthorized')
    )
  }

  static isValidationError(error: any): boolean {
    return (
      error?.status === 400 ||
      error?.code === 'VALIDATION_ERROR' ||
      error?.message?.includes('validation')
    )
  }

  static isNotFoundError(error: any): boolean {
    return (
      error?.status === 404 ||
      error?.code === 'NOT_FOUND' ||
      error?.message?.includes('not found')
    )
  }

  static isServerError(error: any): boolean {
    return error?.status >= 500 || error?.code === 'INTERNAL_SERVER_ERROR'
  }

  static getUserMessage(error: any): string {
    if (typeof error === 'string') {
      return error
    }

    if (this.isNetworkError(error)) {
      return 'Network connection error. Please check your internet connection and try again.'
    }

    if (this.isAuthError(error)) {
      return 'Authentication required. Please sign in to continue.'
    }

    if (this.isValidationError(error)) {
      return error?.userMessage || 'Invalid input. Please check your data and try again.'
    }

    if (this.isNotFoundError(error)) {
      return 'The requested resource was not found.'
    }

    if (this.isServerError(error)) {
      return 'Server error occurred. Please try again later.'
    }

    return error?.userMessage || error?.message || 'An unexpected error occurred.'
  }

  static logError(error: any, context?: any) {
    const errorData = {
      timestamp: new Date().toISOString(),
      error: {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        code: error?.code,
        status: error?.status
      },
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    }

    console.error('Error logged:', errorData)

    // In production, you would send this to an error tracking service
    // like Sentry, LogRocket, or your own logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorTrackingService(errorData)
    }
  }

  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: any

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        if (i === maxRetries - 1) {
          break
        }

        // Don't retry on certain errors
        if (this.isAuthError(error) || this.isValidationError(error)) {
          throw error
        }

        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)))
      }
    }

    throw lastError
  }
}

export class AsyncErrorHandler {
  static wrap<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    errorHandler?: (error: any) => void
  ): (...args: T) => Promise<R | undefined> {
    return async (...args: T) => {
      try {
        return await fn(...args)
      } catch (error) {
        ErrorHandler.logError(error, { function: fn.name, args })
        
        if (errorHandler) {
          errorHandler(error)
        } else {
          console.error('Async error:', error)
        }
        
        return undefined
      }
    }
  }
}

// React hook for error handling
export function useErrorHandler() {
  const handleError = (error: any, userMessage?: string) => {
    ErrorHandler.logError(error)
    
    const message = userMessage || ErrorHandler.getUserMessage(error)
    
    // You could integrate with a toast notification system here
    if (typeof window !== 'undefined') {
      // Example: toast.error(message)
      console.error('User-facing error:', message)
    }
    
    return message
  }

  const handleAsyncError = async <T>(
    asyncFn: () => Promise<T>,
    userMessage?: string
  ): Promise<T | null> => {
    try {
      return await asyncFn()
    } catch (error) {
      handleError(error, userMessage)
      return null
    }
  }

  return {
    handleError,
    handleAsyncError,
    isNetworkError: ErrorHandler.isNetworkError,
    isAuthError: ErrorHandler.isAuthError,
    isValidationError: ErrorHandler.isValidationError,
    isNotFoundError: ErrorHandler.isNotFoundError,
    isServerError: ErrorHandler.isServerError
  }
}