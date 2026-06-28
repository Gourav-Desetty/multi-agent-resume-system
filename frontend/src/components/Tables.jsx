import React from 'react';

export function Table({ headers, children, className = '' }) {
  return (
    <div className={`overflow-x-auto border border-brand-border rounded-xl bg-brand-card ${className}`}>
      <table className="min-w-full divide-y divide-brand-border text-left text-sm">
        <thead className="bg-brand-dark/40 text-brand-muted text-xs font-semibold uppercase tracking-wider">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} scope="col" className="px-6 py-3.5">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border/60 text-brand-text">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, className = '' }) {
  return (
    <tr className={`hover:bg-brand-dark/30 transition duration-150 ${className}`}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap align-middle ${className}`}>
      {children}
    </td>
  );
}
