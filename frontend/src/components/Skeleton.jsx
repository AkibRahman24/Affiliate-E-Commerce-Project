import React from 'react';

const Base = ({ className = '', ...props }) => (
  <div className={`animate-pulse rounded-2xl bg-slate-200 ${className}`} {...props} />
);

const Text = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`animate-pulse rounded-lg bg-slate-200 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        style={{ height: '0.875rem' }}
      />
    ))}
  </div>
);

const Card = ({ className = '' }) => (
  <div className={`rounded-[2rem] bg-white p-6 shadow-soft ${className}`}>
    <Base className="h-48 w-full rounded-2xl" />
    <div className="mt-5 space-y-3">
      <Base className="h-5 w-3/4" />
      <Base className="h-4 w-1/3" />
      <Base className="h-4 w-full" />
      <Base className="h-4 w-2/3" />
    </div>
  </div>
);

const ProductGrid = ({ count = 6 }) => (
  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} />
    ))}
  </div>
);

const StatCard = () => (
  <div className="rounded-[2rem] bg-white p-8 shadow-soft">
    <Base className="h-4 w-24" />
    <Base className="mt-5 h-8 w-20" />
    <Base className="mt-3 h-4 w-32" />
  </div>
);

const TableRow = ({ cols = 5 }) => (
  <tr className="border-b border-slate-100">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <Base className="h-4" style={{ width: `${40 + Math.random() * 40}%` }} />
      </td>
    ))}
  </tr>
);

const OrderCard = () => (
  <div className="rounded-[2rem] bg-white p-6 shadow-soft sm:p-8">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Base className="h-4 w-36" />
        <Base className="h-6 w-20" />
        <Base className="h-4 w-28" />
      </div>
      <Base className="h-6 w-24 rounded-full" />
    </div>
    <Base className="mt-6 h-24 w-full rounded-3xl" />
    <div className="mt-4 flex gap-6">
      <Base className="h-4 w-24" />
      <Base className="h-4 w-24" />
    </div>
  </div>
);

export const Skeleton = { Base, Text, Card, ProductGrid, StatCard, TableRow, OrderCard };
