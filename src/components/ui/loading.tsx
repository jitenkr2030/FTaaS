"use client"

import { Loader2 } from 'lucide-react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  variant?: 'spinner' | 'dots' | 'pulse'
}

export function Loading({ 
  size = 'md', 
  text, 
  className = '', 
  variant = 'spinner' 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        {text && <span className={`ml-2 text-gray-600 ${textClasses[size]}`}>{text}</span>}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className={`bg-gray-400 rounded-full animate-pulse ${sizeClasses[size]}`}></div>
        {text && <span className={`ml-2 text-gray-600 ${textClasses[size]}`}>{text}</span>}
      </div>
    )
  }

  return (
    <div className={`flex items-center ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]} text-gray-600`} />
      {text && <span className={`ml-2 text-gray-600 ${textClasses[size]}`}>{text}</span>}
    </div>
  )
}

interface LoadingCardProps {
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingCard({ 
  title = 'Loading...', 
  description = 'Please wait while we fetch your data',
  size = 'md'
}: LoadingCardProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Loading size={size} className="mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  )
}

interface LoadingSkeletonProps {
  lines?: number
  className?: string
}

export function LoadingSkeleton({ lines = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          {i === lines - 1 && <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>}
        </div>
      ))}
    </div>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  text?: string
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  text = 'Loading...' 
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <Loading text={text} />
        </div>
      )}
    </div>
  )
}