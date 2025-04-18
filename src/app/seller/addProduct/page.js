'use client';

import { useState } from 'react';
import SellerLayout from '@/components/SellerLayout';
import axios from 'axios';

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
    setLoading(true);
    setLoadingMessage('Uploading image...');

    // Step 1: Upload the image to IPFS
    try {
      const imageData = new FormData();
      imageData.append('file', form.image);

      // Assuming you have a backend endpoint to handle the Pinata upload
      const res = await axios.post('/api/uploadToIPFS', imageData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageCID = res.data.cid;  // The returned IPFS CID from the server
      setLoadingMessage('Adding product...');

      // Step 2: Call the smart contract to add product with the CID and other data
      // (you can integrate the smart contract interaction logic here)
      console.log('Image uploaded to IPFS. CID:', imageCID);
      console.log('Product Details:', form);

      // Example: Add product to the blockchain (using Web3 or Ethers.js)
      // await contract.addProduct(...);

      // For now, simulate a successful product addition after 2 seconds
      setTimeout(() => {
        setLoading(false);
        alert('Product added successfully!');
      }, 2000);
    } catch (error) {
      console.error('Error uploading image to IPFS:', error);
      setLoading(false);
      alert('Error uploading image to IPFS');
    }
  };

  return (
    <SellerLayout>
      <div className="relative min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl text-center w-80 max-w-full">
              <div className="flex justify-center items-center">
                <div className="w-6 h-6 border-4 border-t-blue-500 border-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-lg font-semibold mt-4">{loadingMessage}</p>
            </div>
          </div>
        )}

        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-xl border">
          <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">Add New Product</h1>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Product Name */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Product Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Price */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Price (in tinybars)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Units */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Available Units</label>
              <input
                type="number"
                name="units"
                value={form.units}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Product Image</label>
              <div className="flex items-center gap-4">
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-medium transition-all duration-300 hover:bg-blue-700 hover:shadow-lg"
            >
              Add Product
            </button>
          </form>
        </div>
      </div>
    </SellerLayout>
  );
}
