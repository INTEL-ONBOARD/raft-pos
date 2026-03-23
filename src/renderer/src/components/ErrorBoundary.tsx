import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
          <div className="rounded-2xl p-6 max-w-xl w-full" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
            <h2 className="text-base font-bold mb-2" style={{ color: '#dc2626' }}>Something went wrong</h2>
            <p className="text-sm font-mono whitespace-pre-wrap break-all" style={{ color: '#dc2626' }}>
              {this.state.error.message}
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              className="btn-primary mt-4 px-4 py-2 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
