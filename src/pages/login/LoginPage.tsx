import { useState, type FormEvent } from 'react'
import { useAuth } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'
import { Plane, Loader2, AlertCircle } from 'lucide-react'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg mb-3">
            <Plane size={22} className="text-white" strokeWidth={1.8} />
          </div>
          <h1 className="font-display font-bold text-xl text-ink-primary tracking-wide">AEROCORE</h1>
          <p className="text-[11px] text-ink-muted font-mono mt-0.5">Agentic AI Operations Platform</p>
        </div>

        {/* Card */}
        <div className="bg-surface-raised border border-surface-border rounded-xl p-6 shadow-card">
          <h2 className="font-display font-bold text-base text-ink-primary mb-1">Sign in</h2>
          <p className="text-xs text-ink-muted mb-5">Enter your crew credentials to continue</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-display font-bold tracking-wide text-ink-secondary uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@aerocore.com"
                required
                className="px-3 py-2.5 rounded-lg bg-surface-base border border-surface-border text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-indigo-400 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-display font-bold tracking-wide text-ink-secondary uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="px-3 py-2.5 rounded-lg bg-surface-base border border-surface-border text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-indigo-400 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                <AlertCircle size={13} strokeWidth={2} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-display font-semibold text-sm tracking-wide transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {isLoading ? (
                <><Loader2 size={14} className="animate-spin" /> Signing in…</>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Test credentials hint */}
          <div className="mt-4 pt-4 border-t border-surface-border">
            <p className="text-[10px] text-ink-muted font-mono mb-2">Test credentials:</p>
            <div className="flex flex-col gap-1 text-[10px] font-mono text-ink-muted">
              <div className="flex justify-between">
                <span>admin@aerocore.com</span>
                <span className="text-indigo-500">L5 Admin</span>
              </div>
              <div className="flex justify-between">
                <span>duty.manager@aerocore.com</span>
                <span className="text-indigo-500">L3 Manager</span>
              </div>
              <div className="flex justify-between">
                <span>coord@aerocore.com</span>
                <span className="text-indigo-500">L1 Coordinator</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-ink-muted">Password (all):</span>
                <span className="text-indigo-500">Admin@123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
