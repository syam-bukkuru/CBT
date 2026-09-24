import React from 'react'

// Base pulsing placeholder block. `dark` switches to a translucent-white variant for use
// on the dark hero/summary banners (bg-slate-900) — never stack two bg-* utilities on one
// element, since which one wins is unspecified, so this is a single conditional class.
export function Skeleton({ className = '', dark = false }) {
  return <div className={`animate-pulse rounded-md ${dark ? 'bg-white/10' : 'bg-slate-200 dark:bg-slate-700/60'} ${className}`} />
}

function SubjectCardSkeleton() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="h-5 w-14 rounded" />
      </div>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

// Mirrors TestDashboard's data-dependent section (Today's Tests + Subjects grid) — the
// hero banner above it is static copy, so it renders immediately and is never skeletoned.
export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SubjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function TopicListSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-6 w-44" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Skeleton className="w-4 h-4 rounded shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-6 w-14 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ExamSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-4 md:gap-6">
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="card p-5 space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="w-full aspect-square rounded" />
            ))}
          </div>
          <Skeleton className="h-9 w-full rounded" />
        </div>
      </div>
    </div>
  )
}

export function ResultSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="card p-6 md:p-8 bg-slate-900 border-slate-800 space-y-4">
        <Skeleton dark className="h-4 w-40" />
        <Skeleton dark className="h-6 w-2/3" />
        <div className="grid grid-cols-3 gap-3 mt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} dark className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function LeaderboardSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="card p-6 bg-slate-900 border-slate-800 space-y-3">
        <Skeleton dark className="h-4 w-32" />
        <Skeleton dark className="h-6 w-1/2" />
      </div>
      <div className="card overflow-hidden divide-y divide-[var(--border-color)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="w-7 h-7 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function HistorySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
          <Skeleton className="h-9 w-full rounded" />
          <Skeleton className="h-9 w-full rounded" />
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card p-6 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  )
}
