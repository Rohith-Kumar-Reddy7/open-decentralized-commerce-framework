'use client';

import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, ethers } from 'ethers';
import SellerLayout from '@/components/SellerLayout';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';

// IMPORT your contract ABIs and addresses
import SellerRegistryABI from '@/contracts/SellerRegistryABI.json';
import InventoryRegistryABI from '@/contracts/InventoryRegistryABI.json';

const SELLER_REGISTRY_ADDRESS = CONTRACT_ADDRESSES.SellerRegistry;
const INVENTORY_REGISTRY_ADDRESS = CONTRACT_ADDRESSES.InventoryRegistry;

export default function AddProductPage() {
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    units: '',
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    async function getWallet() {
      if (window.ethereum) {
        const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWallet(account);
      }
    }
    getWallet();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    if (!form.image || !wallet) return;

    try {
      setLoading(true);
      setLoadingMessage('Verifying seller...');

      // Connect to Ethereum provider
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const sellerRegistry = new Contract(
        SELLER_REGISTRY_ADDRESS,
        SellerRegistryABI,
        signer
      );

      const isRegistered = await sellerRegistry.isRegistered(userAddress);

      if (!isRegistered) {
        setLoading(false);
        setErrorMessage('❌ You must be a registered seller to add a product.');
        return;
      }

      // Upload image to IPFS
      setLoadingMessage('Uploading image to IPFS...');
      const imageData = new FormData();
      imageData.append('file', form.image);

      const res = await fetch('/api/uploadToIPFS', {
        method: 'POST',
        body: imageData,
      });

      if (!res.ok) throw new Error('Image upload failed');
      const { cid: imageCID } = await res.json();

      // Add product to InventoryRegistry
      setLoadingMessage('Adding product to your inventory (confirm the metamask transaction)...');

      const inventoryRegistry = new Contract(
        INVENTORY_REGISTRY_ADDRESS,
        InventoryRegistryABI,
        signer
      );

      // Convert category string to enum index (must match smart contract order)
      const categories = ['Fashion', 'Electronics', 'Furniture', 'Books', 'Beauty', 'Sports'];
      const categoryIndex = categories.indexOf(form.category);
      if (categoryIndex === -1) throw new Error('Invalid category');

      const tx = await inventoryRegistry.addProduct(
        form.name,
        categoryIndex,
        ethers.parseUnits(form.price, 0),
        ethers.parseUnits(form.units, 0),
        imageCID
      );

      await tx.wait();

      setLoading(false);
      setSuccessMessage('✅ Product added successfully!');
      setForm({
        name: '',
        category: '',
        price: '',
        units: '',
        image: null,
      });
      setImagePreview(null);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
      setErrorMessage('❌ Error uploading image or adding product.');
    }
  };

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  return (
    <SellerLayout>
      <div className="relative min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
        {loading && (
          <div className="fixed inset-0 z-50 bg-white/80 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center animate-pulse">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium text-blue-700">{loadingMessage}</p>
          </div>
        </div>
        )}

        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-xl border">
          <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">Add New Product</h1>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Product Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="" disabled>Select a Category</option>
                <option value="Fashion">Fashion</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Books">Books</option>
                <option value="Beauty">Beauty</option>
                <option value="Sports">Sports</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Price (tinybars)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Available Units</label>
              <input
                type="number"
                name="units"
                value={form.units}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Product Image</label>
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full object-contain" />
                ) : (
                  <span className="text-gray-500">Click to upload image</span>
                )}
              </label>
            </div>

            <button
              type="submit"
              disabled={!form.image}
              className={`w-full py-3 rounded-lg text-lg font-medium transition-all duration-300 ${
                form.image
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                  : 'bg-blue-300 text-white opacity-50 cursor-not-allowed'
              }`}
            >
              Add Product
            </button>
          </form>
        </div>

        {/* Success/Error Popup */}
        {(successMessage || errorMessage) && (
          <div className="fixed top-6 right-6 z-50">
            <div
              className={`flex items-start gap-3 p-4 rounded-lg shadow-lg text-white transition-all duration-300 ${
                successMessage ? 'bg-green-600' : 'bg-red-600'
              }`}
            >
              <div className="flex-1">
                <p className="font-medium">
                  {successMessage || errorMessage}
                </p>
              </div>
              <button
                onClick={() => {
                  setSuccessMessage('');
                  setErrorMessage('');
                }}
                className="text-white hover:text-gray-200 text-xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
