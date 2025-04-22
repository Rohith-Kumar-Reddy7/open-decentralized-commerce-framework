'use client';

import { useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import SellerLayout from '@/components/SellerLayout';
import contractABI from '@/contracts/SellerRegistryABI.json';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';

const SELLER_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.SellerRegistry;

export default function SellerRegisterPage() {
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    city: '',
    locationAddress: '',
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    const phoneRegex = /^\d{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!phoneRegex.test(form.phone)) {
      newErrors.phone = 'Phone must be a valid 10-digit number';
    }
    if (!emailRegex.test(form.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' }); // clear error on change
  };

  const registerSeller = async () => {
    if (!validate()) return;

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
    if (statusType === 'success') return <span className="text-green-600 text-2xl">✅</span>;
    if (statusType === 'error') return <span className="text-red-600 text-2xl">❌</span>;
    if (statusType === 'info') return <span className="text-yellow-600 text-2xl">⚠️</span>;
    return null;
  };

  return (
    <SellerLayout>
      <div className="relative min-h-screen flex items-center justify-center bg-gray-50 px-4">
        {loading && (
          <div className="fixed inset-0 z-50 bg-white/80 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center animate-pulse">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-medium text-blue-700">Waiting for transaction confirmation...</p>
            </div>
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
                  type={field === 'email' ? 'email' : 'text'}
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border ${
                    errors[field] ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 ${
                    errors[field] ? 'focus:ring-red-400' : 'focus:ring-blue-500'
                  }`}
                />
                {errors[field] && (
                  <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
                )}
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
