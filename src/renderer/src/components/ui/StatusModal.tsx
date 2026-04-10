import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface StatusModalProps {
  isOpen: boolean
  type: 'success' | 'error'
  title?: string
  message: string
  actionLabel?: string
  isGlobal?: boolean
  onClose: () => void
}

export function StatusModal({
  isOpen,
  type,
  title,
  message,
  actionLabel,
  isGlobal = false,
  onClose
}: StatusModalProps) {
  if (!isOpen) return null

  const isSuccess = type === 'success'
  
  const defaultTitle = isSuccess ? 'Action Successful' : 'Action Failed'
  const displayTitle = title || defaultTitle
  const _actionLabel = actionLabel || (isSuccess ? 'Done' : 'Try Again')

  // Theme values
  const theme = {
    color: isSuccess ? '#4ade80' : '#ef4444',
    bgCore: isSuccess ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    bgHover: isSuccess ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
    border: isSuccess ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
    gradient: isSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
    boxShadow: isSuccess ? '0 0 20px rgba(34,197,94,0.1)' : '0 0 20px rgba(239,68,68,0.1)'
  }

  const containerClass = isGlobal 
    ? "fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    : "absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm rounded-[inherit]"

  return (
    <div className={containerClass}>
      <div className="bg-[#12121a] border border-white/10 rounded-3xl w-full max-w-sm p-8 text-center flex flex-col items-center shadow-2xl relative overflow-hidden">
        {/* Subtle light beam bg */}
        <div 
          style={{ 
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', 
            width: '200px', height: '100px', 
            background: `radial-gradient(ellipse at top, ${theme.gradient}, transparent 70%)`, 
            pointerEvents: 'none' 
          }} 
        />
        
        {/* Icon Circle */}
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mb-5" 
          style={{ background: theme.bgCore, border: `1px solid ${theme.border}`, boxShadow: theme.boxShadow }}
        >
          {isSuccess ? (
             <CheckIcon style={{ width: '40px', height: '40px', color: theme.color }} />
          ) : (
             <XMarkIcon style={{ width: '40px', height: '40px', color: theme.color }} />
          )}
        </div>

        {/* Text */}
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
          {displayTitle}
        </h3>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '0 0 24px', lineHeight: 1.5 }}>
          {message}
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl transition-all"
          style={{ 
            background: theme.gradient, 
            border: `1px solid ${theme.border}`, 
            color: theme.color, 
            fontSize: '14px', 
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = theme.bgHover }}
          onMouseLeave={(e) => { e.currentTarget.style.background = theme.gradient }}
        >
          {_actionLabel}
        </button>
      </div>
    </div>
  )
}
