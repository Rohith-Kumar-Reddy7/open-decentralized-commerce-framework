'use client';

import { useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import SellerLayout from '@/components/SellerLayout';
import contractABI from '@/contracts/SellerRegistryABI.json';

const SELLER_CONTRACT_ADDRESS = '0x82b7ac6fbfF4F093541dBb2C1824f36100227E1A';

export default function SellerRegisterPage() {
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    city: '',
    locationAddress: '',
  });

  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState(''); // "success", "error", "info"
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const registerSeller = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask');
        return;
      }

      alert('Please confirm the registration transaction in MetaMask');

      setLoading(true);
      setStatus('');
      setStatusType('');

      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const contract = new Contract(SELLER_CONTRACT_ADDRESS, contractABI, signer);

      const alreadyRegistered = await contract.isRegistered(userAddress);
      if (alreadyRegistered) {
        setStatus('You are already registered as a seller.');
        setStatusType('info');
        setLoading(false);
        return;
      }

      const tx = await contract.registerSeller(
        form.businessName,
        form.ownerName,
        form.phone,
        form.email,
        form.city,
        form.locationAddress
      );

      setStatus('Transaction sent. Waiting for confirmation...');
      await tx.wait();
      setStatus('Registration complete.');
      setStatusType('success');
    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        setStatus('Transaction was rejected by the user.');
        setStatusType('error');
      } else if (err?.reason === 'Seller already registered') {
        setStatus('You are already registered as a seller.');
        setStatusType('info');
      } else {
        setStatus('Registration failed. Try again.');
        setStatusType('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStatusIcon = () => {
    if (statusType === 'success') {
      return <span className="text-green-600 text-2xl">✅</span>;
    } else if (statusType === 'error') {
      return <span className="text-red-600 text-2xl">❌</span>;
    } else if (statusType === 'info') {
      return <span className="text-yellow-600 text-2xl">⚠️</span>;
    }
    return null;
  };

  return (
    <SellerLayout>
      <div className="relative min-h-screen flex items-center justify-center bg-gray-50 px-4">
        {loading && (
          <div className="absolute inset-0 z-50 bg-white bg-opacity-80 flex flex-col items-center justify-center">
            <svg
              className="animate-spin h-10 w-10 text-blue-600 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <p className="text-lg font-medium text-gray-700">Waiting for transaction confirmation...</p>
          </div>
        )}

        <div
          className={`bg-white shadow-xl rounded-2xl p-8 w-full max-w-xl border ${
            loading ? 'opacity-30 pointer-events-none' : ''
          }`}
        >
          <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">Seller Registration</h1>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              registerSeller();
            }}
          >
            {['businessName', 'ownerName', 'phone', 'email', 'city', 'locationAddress'].map((field) => (
              <div key={field}>
                <label className="block text-gray-700 font-medium mb-1 capitalize">
                  {field.replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  type="text"
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-medium transition-all duration-300 hover:bg-blue-700 hover:shadow-lg"
            >
              Register
            </button>
          </form>

          {status && (
            <div className="mt-6 flex items-center justify-center space-x-3">
              {renderStatusIcon()}
              <p
                className={`text-sm ${
                  statusType === 'success'
                    ? 'text-green-600'
                    : statusType === 'error'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}
              >
                {status}
              </p>
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  );
}
