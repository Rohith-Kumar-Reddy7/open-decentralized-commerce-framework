'use client';

import Link from 'next/link';

export default function SellerLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md py-4 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="text-2xl font-bold text-blue-700">
          Buyer Portal
        </div>
        <nav className="space-x-6">
          <Link href="/buyer/marketplace" className="text-gray-700 hover:text-blue-600 font-medium">marketplace</Link>
          <Link href="/buyer/orders" className="text-gray-700 hover:text-blue-600 font-medium">Orders</Link>
        </nav>
      </header>

      {/* Page Content */}
      <main className="p-8">
        {children}
      </main>
    </div>
  );
}
