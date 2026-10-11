import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
}

function Card({ children, className = '', ...props }: CardProps) {
  return (
    <section
      className={`rounded-card border border-gray-200 bg-white p-6 shadow-card sm:p-8 ${className}`}
      {...props}
    >
      {children}
    </section>
  )
}

export default Card
