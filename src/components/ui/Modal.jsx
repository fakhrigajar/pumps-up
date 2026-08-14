import { useEffect } from 'react'
import { IconClose } from '../Icons'

const WIDTHS = { md: 'max-w-md', lg: 'max-w-2xl' }

export function Modal({ title, description, ariaLabel, onClose, width = 'md', children }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        className={`relative w-full ${WIDTHS[width] ?? WIDTHS.md} rounded-card border border-line bg-surface-1 shadow-pop`}
      >
        {title ? (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-ink-1">{title}</h2>
              {description ? (
                <p className="mt-0.5 text-[13px] text-ink-2">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1.5 -mt-1 rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink-1"
            >
              <IconClose />
              <span className="sr-only">{ariaLabel ?? title}</span>
            </button>
          </div>
        ) : null}

        {children}
      </div>
    </div>
  )
}

export function ModalFooter({ children }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
      {children}
    </div>
  )
}
