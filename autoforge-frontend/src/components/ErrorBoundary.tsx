import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-forge-bg flex items-center justify-center p-8">
          <div className="glass rounded-2xl p-10 border border-red-500/20 max-w-md text-center">
            <p className="text-3xl mb-4">⚠️</p>
            <h2 className="font-display text-xl font-bold text-forge-text mb-2">Something went wrong</h2>
            <p className="text-forge-muted text-sm mb-6">{this.state.message || 'An unexpected error occurred.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-forge-orange hover:bg-forge-orange-light text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
