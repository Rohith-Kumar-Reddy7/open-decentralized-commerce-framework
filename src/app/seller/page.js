'use client';

import React from 'react';

const SellerLandingPage = () => {
  return (
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

        {/* Or Login if already registered */}
        <div className="mt-4">
          <p className="text-gray-600">Already have an account?</p>
          <a 
            href="/seller/login" 
            className="text-blue-600 hover:underline"
          >
            Login Here
          </a>
        </div>
      </div>

      {/* Footer Section */}
      {/* <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; 2025 Open Digital Market. All Rights Reserved.</p>
      </footer> */}
    </div>
  );
};

export default SellerLandingPage;
