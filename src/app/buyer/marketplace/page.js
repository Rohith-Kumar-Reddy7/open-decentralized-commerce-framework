'use client';

import { useState, useEffect } from 'react';
import BuyerLayout from '@/components/BuyerLayout';
import { BrowserProvider, Contract, ethers } from "ethers";
import SellerRegistryABI from "@/contracts/SellerRegistryABI.json";
import InventoryRegistryABI from "@/contracts/InventoryRegistryABI.json";
import { CONTRACT_ADDRESSES } from '@/constants/contracts';

export default function MarketplacePage() {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [inputCity, setInputCity] = useState('');
  const [inputCategory, setInputCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading products...');
  const [imagesLoaded, setImagesLoaded] = useState(0); // Track loaded images
  const [totalImages, setTotalImages] = useState(0); // Track total number of images

  const inventoryContractAddress = CONTRACT_ADDRESSES.InventoryRegistry;
  const sellerContractAddress = CONTRACT_ADDRESSES.SellerRegistry;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true); // Start loading
      setImagesLoaded(0); // Reset images loaded count
      setTotalImages(0); // Reset total image count for each search

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const inventoryRegistryContract = new ethers.Contract(inventoryContractAddress, InventoryRegistryABI, signer);
      const sellerRegistryContract = new ethers.Contract(sellerContractAddress, SellerRegistryABI, signer);

      try {
        let fetchedProducts = [];
        let totalImageCount = 0;

        if (!city && !category) {
          fetchedProducts = await inventoryRegistryContract.getAllProducts();
        } else if (!city) {
          if (category) {
            const categoryEnum = parseCategory(category);
            fetchedProducts = await inventoryRegistryContract.getProductsByCategory(categoryEnum);
          } else {
            const totalProducts = await inventoryRegistryContract.getProductsBySeller(address);
            fetchedProducts = totalProducts;
          }
        } else {
          const sellersInCity = await sellerRegistryContract.getSellersByCity(city);

          for (const seller of sellersInCity) {
            if (category) {
              const sellerProducts = await inventoryRegistryContract.getProductsBySellerOfCategory(seller.wallet, parseCategory(category));
              fetchedProducts = [...fetchedProducts, ...sellerProducts];
            } else {
              const sellerProducts = await inventoryRegistryContract.getProductsBySeller(seller.wallet);
              fetchedProducts = [...fetchedProducts, ...sellerProducts];
            }
          }
        }

        // Update the total number of images for all products
        totalImageCount = fetchedProducts.length;
        setTotalImages(totalImageCount); // Update total image count state

        // Set the fetched products
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [city, category]); // Trigger effect on city/category change

  // Image load handler
  const handleImageLoad = () => {
    setImagesLoaded((prev) => prev + 1); // Increment the count of loaded images
  };

  // Handle search submit (city and category filter)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCity(inputCity);
    setCategory(inputCategory);
  };

  // Map categories to numeric values
  const parseCategory = (category) => {
    switch (category) {
      case 'Fashion': return 0;
      case 'Electronics': return 1;
      case 'Furniture': return 2;
      case 'Books': return 3;
      case 'Beauty': return 4;
      case 'Sports': return 5;
      default: return null;
    }
  };

  useEffect(() => {
    // Check if all images are loaded, and then stop the loading spinner
    if (imagesLoaded === totalImages) {
      setLoading(false); // Stop loading spinner when all images are loaded
    }
  }, [imagesLoaded, totalImages]); // Trigger effect when imagesLoaded or totalImages change

  return (
    <BuyerLayout>
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        {/* Filter Bar - Positioned at the top, touching the header */}
        <div className="bg-white shadow-md p-4 w-full sticky top-0 z-10">
          <form onSubmit={handleSearchSubmit} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter your city"
                value={inputCity}
                onChange={(e) => setInputCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex-1">
              <select
                value={inputCategory}
                onChange={(e) => setInputCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Category</option>
                <option value="Fashion">Fashion</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Books">Books</option>
                <option value="Beauty">Beauty</option>
                <option value="Sports">Sports</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              <i className="fas fa-search"></i> Search
            </button>
          </form>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="fixed inset-0 z-50 bg-white/80 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center animate-pulse">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-medium text-blue-700">{loadingMessage}</p>
            </div>
          </div>
        )}

        {/* Display Products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10">
          {!loading && products.length === 0 && (
            <p className="text-center text-gray-500">No products found based on your search criteria.</p>
          )}

          {products.map((product) => (
            <div key={product.id} className="border border-gray-300 rounded-lg p-4 bg-white shadow-md">
              <img
                src={`https://sapphire-important-squid-465.mypinata.cloud/ipfs/${product.imageCID}`}
                alt={product.name}
                className="w-full h-64 object-cover rounded-md mb-4"
                onLoad={handleImageLoad}
                onError={handleImageLoad} // Handles both image load and error to increment the count
              />
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-gray-500">{product.category}</p>
              <p className="text-xl font-bold mt-2">{product.price} tinybars</p>
              <p className="text-sm text-gray-400">Available: {product.availableUnits}</p>
            </div>
          ))}
        </div>
      </div>
    </BuyerLayout>
  );
}
