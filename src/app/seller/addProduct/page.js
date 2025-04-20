'use client';

import { useState } from 'react';
import SellerLayout from '@/components/SellerLayout';

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
    if (!form.image) return;

    setLoading(true);
    setLoadingMessage('Uploading image...');

    try {
      const imageData = new FormData();
      imageData.append('file', form.image);

      const res = await fetch('/api/uploadToIPFS', {
        method: 'POST',
        body: imageData,
      });

      if (!res.ok) throw new Error('Failed to upload image');

      const data = await res.json();
      const imageCID = data.cid;

      setLoadingMessage('Adding product...');

      // Simulate contract interaction
      console.log('Image CID:', imageCID);
      console.log('Product Data:', form);

      // Simulate delay
      setTimeout(() => {
        setLoading(false);
        alert('Product added successfully!');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
      alert('Error uploading image or adding product');
    }
  };

  return (
    <SellerLayout>
      <div className="relative min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
        {/* Register-style translucent overlay */}
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <p className="text-lg font-medium text-gray-700">{loadingMessage}</p>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
      </div>
    </SellerLayout>
  );
}
