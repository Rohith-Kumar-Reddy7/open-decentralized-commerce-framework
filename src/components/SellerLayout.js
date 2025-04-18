'use client';

import Link from 'next/link';

export default function SellerLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md py-4 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="text-2xl font-bold text-blue-700">
          Seller Portal
        </div>
        <nav className="space-x-6">
          <Link href="/seller/register" className="text-gray-700 hover:text-blue-600 font-medium">Register</Link>
          <Link href="/seller/addProduct" className="text-gray-700 hover:text-blue-600 font-medium">Add Product</Link>
          <Link href="/seller/inventory" className="text-gray-700 hover:text-blue-600 font-medium">Inventory</Link>
          <Link href="/seller/orders" className="text-gray-700 hover:text-blue-600 font-medium">Orders</Link>
        </nav>
      </header>

      {/* Page Content */}
      <main className="p-8">
        {children}
      </main>
    </div>
  );
}
