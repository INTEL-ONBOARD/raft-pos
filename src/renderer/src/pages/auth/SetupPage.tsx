import { useState, useEffect, type FormEvent } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Check, ArrowLeft } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import type { SetupRequest, SetupResult, SetupCheckResult } from '@shared/types/auth.types'
import { AuthLayout } from '../../components/auth/AuthLayout'

// ─── Shared sub-components ─────────────────────────────────────────────────

function AuthInput({
  id,
  type,
  value,
  onChange,
  placeholder,
  autoFocus,
  autoComplete,
  required,
  suffix,
}: {
  id: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  autoComplete?: string
  required?: boolean
  suffix?: ReactNode
}) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        required={required}
        style={{
          width: '100%',
          height: '42px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#ffffff',
          fontSize: '0.875rem',
          padding: suffix ? '0 2.5rem 0 0.75rem' : '0 0.75rem',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgba(99,102,241,0.6)'
          e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(255,255,255,0.08)'
          e.target.style.boxShadow = 'none'
        }}
      />
      {suffix && (
        <div
          style={{
            position: 'absolute',
            right: '0.625rem',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          {suffix}
        </div>
      )}
    </div>
  )
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.75rem',
        fontWeight: 500,
        marginBottom: '0.375rem',
      }}
    >
      {children}
    </label>
  )
}

function EyeToggle({ show, onToggle, label }: { show: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        padding: '0.25rem',
      }}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

interface SetupState {
  step: 1 | 2
  storeName: string
  branchName: string
  name: string
  email: string
  password: string
  confirmPassword: string
  showPassword: boolean
  showConfirm: boolean
  error: string | null
  loading: boolean
}

const initialState: SetupState = {
  step: 1,
  storeName: '',
  branchName: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  showPassword: false,
  showConfirm: false,
  error: null,
  loading: false,
}

export default function SetupPage() {
  const [state, setState] = useState<SetupState>(initialState)
  const navigate = useNavigate()

  function set(patch: Partial<SetupState>) {
    setState((s) => ({ ...s, ...patch }))
  }

  // Guard: if setup already complete, redirect to login
  useEffect(() => {
    ipc
      .invoke<SetupCheckResult>(IPC.AUTH_CHECK_SETUP)
      .then((res) => {
        if (res.setupComplete) navigate('/login', { replace: true })
      })
      .catch(() => {
        // If check fails, stay on setup page (safe for first-run)
      })
  }, [navigate])

  // Step 1 continue
  function handleContinue(e: FormEvent) {
    e.preventDefault()
    const storeName = state.storeName.trim()
    const branchName = state.branchName.trim()
    if (!storeName || !branchName) {
      set({ error: 'Store name and branch name are required.' })
      return
    }
    set({ step: 2, error: null, storeName, branchName })
  }

  // Step 2 submit
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const name = state.name.trim()
    const email = state.email.trim()
    const { password, confirmPassword } = state

    if (!name || !email || !password || !confirmPassword) {
      set({ error: 'All fields are required.' })
      return
    }
    if (password.length < 8) {
      set({ error: 'Password must be at least 8 characters.' })
      return
    }
    if (password !== confirmPassword) {
      set({ error: 'Passwords do not match.' })
      return
    }

    set({ loading: true, error: null })
    try {
      const req: SetupRequest = {
        storeName: state.storeName,
        branchName: state.branchName,
        name,
        email,
        password,
      }
      const result = await ipc.invoke<SetupResult>(IPC.AUTH_COMPLETE_SETUP, req)
      if (result.success) {
        navigate('/login', { replace: true })
      } else {
        set({ error: result.error, loading: false })
      }
    } catch {
      set({ error: 'An unexpected error occurred. Please try again.', loading: false })
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  // Inline JSX variables (not inner components) to avoid React remounting on each render
  const stepDots = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}>
      {/* Dot 1 */}
      {state.step === 1 ? (
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1' }} />
      ) : (
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'rgba(99,102,241,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={11} color="#818cf8" strokeWidth={3} />
        </div>
      )}
      {/* Dot 2 */}
      <div
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: state.step === 2 ? '#6366f1' : 'rgba(255,255,255,0.15)',
        }}
      />
    </div>
  )

  const errorAlert = state.error ? (
    <div
      role="alert"
      style={{
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '8px',
        color: '#f87171',
        fontSize: '0.8125rem',
        padding: '0.75rem 1rem',
      }}
    >
      {state.error}
    </div>
  ) : null

  return (
    <AuthLayout>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo mark */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: '#6366f1',
              boxShadow: '0 0 0 6px rgba(99,102,241,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <span style={{ color: '#fff', fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>R</span>
          </div>
          <h1
            style={{
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {state.step === 1 ? 'Welcome to Raft POS' : 'Create your admin account'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginTop: '0.375rem', textAlign: 'center' }}>
            {state.step === 1
              ? "Let's get your store set up"
              : 'This account will have full access to Raft POS'}
          </p>
        </div>

        {/* Back button (Step 2 only) */}
        {state.step === 2 && (
          <button
            type="button"
            onClick={() => set({ step: 1, error: null })}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0',
              marginBottom: '1rem',
              fontFamily: 'inherit',
            }}
          >
            <ArrowLeft size={14} />
            Back
          </button>
        )}

        {stepDots}

        {/* Step 1 */}
        {state.step === 1 && (
          <form onSubmit={handleContinue} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <FieldLabel htmlFor="setup-store">Store Name</FieldLabel>
              <AuthInput
                id="setup-store"
                type="text"
                value={state.storeName}
                onChange={(v) => set({ storeName: v })}
                placeholder="e.g. Raft General Store"
                autoFocus
                autoComplete="organization"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="setup-branch">Branch Name</FieldLabel>
              <AuthInput
                id="setup-branch"
                type="text"
                value={state.branchName}
                onChange={(v) => set({ branchName: v })}
                placeholder="e.g. Main Branch"
                autoComplete="off"
                required
              />
            </div>
            {errorAlert}
            <button
              type="submit"
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                background: '#6366f1',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'inherit',
                marginTop: '0.5rem',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#4f46e5' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#6366f1' }}
            >
              Continue
            </button>
          </form>
        )}

        {/* Step 2 */}
        {state.step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <FieldLabel htmlFor="setup-name">Full Name</FieldLabel>
              <AuthInput
                id="setup-name"
                type="text"
                value={state.name}
                onChange={(v) => set({ name: v })}
                placeholder="e.g. Juan dela Cruz"
                autoFocus
                autoComplete="name"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="setup-email">Email</FieldLabel>
              <AuthInput
                id="setup-email"
                type="email"
                value={state.email}
                onChange={(v) => set({ email: v })}
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="setup-password">Password</FieldLabel>
              <AuthInput
                id="setup-password"
                type={state.showPassword ? 'text' : 'password'}
                value={state.password}
                onChange={(v) => set({ password: v })}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                suffix={
                  <EyeToggle
                    show={state.showPassword}
                    onToggle={() => set({ showPassword: !state.showPassword })}
                    label={state.showPassword ? 'Hide password' : 'Show password'}
                  />
                }
              />
            </div>
            <div>
              <FieldLabel htmlFor="setup-confirm">Confirm Password</FieldLabel>
              <AuthInput
                id="setup-confirm"
                type={state.showConfirm ? 'text' : 'password'}
                value={state.confirmPassword}
                onChange={(v) => set({ confirmPassword: v })}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                suffix={
                  <EyeToggle
                    show={state.showConfirm}
                    onToggle={() => set({ showConfirm: !state.showConfirm })}
                    label={state.showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  />
                }
              />
            </div>
            {errorAlert}
            <button
              type="submit"
              disabled={state.loading}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                background: '#6366f1',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: state.loading ? 'not-allowed' : 'pointer',
                opacity: state.loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontFamily: 'inherit',
                marginTop: '0.5rem',
              }}
              onMouseEnter={(e) => { if (!state.loading) e.currentTarget.style.background = '#4f46e5' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#6366f1' }}
            >
              {state.loading && <Loader2 size={16} className="animate-spin" />}
              {state.loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
