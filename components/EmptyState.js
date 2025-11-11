'use client';
export default function EmptyState({ title='Nothing here yet', subtitle='' }) {
  return (
    <div className="card p-8 text-center text-gray-600">
      <div className="text-base font-medium">{title}</div>
      {subtitle && <div className="text-sm mt-1">{subtitle}</div>}
    </div>
  );
}
