'use client';

import React from 'react';
import BuyerLayout from '@/components/BuyerLayout';

const BuyerLandingPage = () => {
  return (
    <BuyerLayout>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-8 px-4">
        {/* Header Section */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome to Open Digital Market
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Get easy access to a vast network of sellers
          </p>
        </header>

        {/* Call to Action */}
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
          <h2 className="text-3xl font-semibold text-gray-800">Get Started as a Buyer</h2>
          <p className="mt-4 text-lg text-gray-600">
          Discover a vast array of products from around the globe, all with a seamless and effortless purchasing experience.
          </p>

          {/* Register Button */}
          <div className="mt-6">
            <a 
              href="/buyer/marketplace" 
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              Browse Products
            </a>
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
};

export default BuyerLandingPage;
