'use client';

import React from 'react';
import SellerLayout from '@/components/SellerLayout';

const SellerLandingPage = () => {
  return (
    <SellerLayout>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-8 px-4">
        {/* Header Section */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome to Open Digital Market
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            The network that empowers small sellers to reach global buyers
          </p>
        </header>

        {/* Call to Action */}
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
          <h2 className="text-3xl font-semibold text-gray-800">Get Started as a Seller</h2>
          <p className="mt-4 text-lg text-gray-600">
            Join the network and showcase your products to a global audience. Simply register your business and start selling today!
          </p>

          {/* Register Button */}
          <div className="mt-6">
            <a 
              href="/seller/register" 
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              Register Now
            </a>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerLandingPage;
