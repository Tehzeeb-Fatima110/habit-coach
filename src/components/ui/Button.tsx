import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  loading?: boolean
  children: ReactNode
}

function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'bg-accent-600 text-white shadow-sm hover:bg-accent-700'
      : 'border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50'

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center rounded-control px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}

export default Button
