'use client';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-2xl bg-[color:var(--border)]/80 /80 ${className}`} />;
}
