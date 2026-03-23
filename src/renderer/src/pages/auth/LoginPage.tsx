import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ipc } from '../../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { useAuthStore } from '../../stores/auth.store'
import type { AuthResult, LoginRequest } from '@shared/types/auth.types'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const req: LoginRequest = { email, password }
      const result = await ipc.invoke<AuthResult>(IPC.AUTH_LOGIN, req)
      if (result.success) {
        setAuth(result.data)
        navigate('/', { replace: true })
      } else {
        setError(result.error)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="modal-panel w-full max-w-sm p-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ background: 'rgba(79,70,229,0.10)' }}>
            <span className="text-xl font-bold" style={{ color: '#4F46E5' }}>R</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Raft POS</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              className="dark-input"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="dark-input"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.15)' }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
