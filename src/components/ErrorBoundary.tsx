import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode
  /** Optional fallback UI to show when error occurs */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean
  /** The caught error, if any */
  error: Error | null
}

/**
 * Error Boundary component for catching and handling React render errors.
 *
 * Features:
 * - **Catches render errors**: Prevents entire app crash from component errors
 * - **Graceful fallback UI**: Shows user-friendly error message with recovery options
 * - **Reset functionality**: Allows users to attempt recovery by resetting state
 * - **Error logging**: Logs errors to console (can be extended for telemetry)
 * - **Customizable fallback**: Accepts custom fallback UI via props
 *
 * This component should wrap the entire app or major sections to provide
 * resilience against unexpected errors.
 *
 * @example
 * ```tsx
 * // Wrap entire app
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * ```tsx
 * // With custom fallback
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <div>
 *       <h1>Custom Error</h1>
 *       <p>{error.message}</p>
 *       <button onClick={reset}>Try Again</button>
 *     </div>
 *   )}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  /**
   * Static method called when a child component throws an error.
   * Updates state to trigger fallback UI rendering.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  /**
   * Lifecycle method called after an error is caught.
   * Used for logging errors to external services.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // TODO: Send error to telemetry service
    // telemetryService.logError({
    //   error,
    //   componentStack: errorInfo.componentStack,
    //   timestamp: new Date().toISOString(),
    // })
  }

  /**
   * Resets the error boundary state, allowing the user to retry.
   * This clears the error and re-renders children.
   */
  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetErrorBoundary)
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="max-w-md text-center">
            <h1 className="text-text-primary font-display text-2xl mb-4">Something went wrong</h1>
            <p className="text-text-secondary mb-2">
              An unexpected error occurred while rendering this component.
            </p>
            <details className="text-left mb-4 p-4 bg-surface-secondary rounded">
              <summary className="cursor-pointer text-sm font-semibold mb-2">Error details</summary>
              <pre className="text-xs overflow-auto">{this.state.error.message}</pre>
              {this.state.error.stack && (
                <pre className="text-xs overflow-auto mt-2 text-text-tertiary">
                  {this.state.error.stack}
                </pre>
              )}
            </details>
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.resetErrorBoundary}
                className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-primary/90"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-surface-tertiary text-text-primary rounded hover:bg-surface-tertiary/90"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
