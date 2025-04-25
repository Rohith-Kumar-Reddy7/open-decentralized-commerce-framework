'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BuyerLayout from '@/components/BuyerLayout';
import { BrowserProvider, ethers } from "ethers";
import SellerRegistryABI from "@/contracts/SellerRegistryABI.json";
import InventoryRegistryABI from "@/contracts/InventoryRegistryABI.json";
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import OrderRegistryABI from "@/contracts/OrderRegistryABI.json";

export default function MarketplacePage() {
  const router = useRouter();

  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [inputCity, setInputCity] = useState('');
  const [inputCategory, setInputCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading products...');
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [totalImages, setTotalImages] = useState(0);

  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [currentSeller, setCurrentSeller] = useState(null);

  const [showBill, setShowBill] = useState(false);
  const [validatedCart, setValidatedCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [billError, setBillError] = useState('');
  const [isPaying, setIsPaying] = useState(false); // <-- New state

  const inventoryContractAddress = CONTRACT_ADDRESSES.InventoryRegistry;
  const sellerContractAddress = CONTRACT_ADDRESSES.SellerRegistry;
  const orderContractAddress = CONTRACT_ADDRESSES.OrderRegistry;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setImagesLoaded(0);
      setTotalImages(0);

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

        totalImageCount = fetchedProducts.length;
        setTotalImages(totalImageCount);
        
        const enabledProducts = fetchedProducts.map(parseProductStruct).filter(p => p.status);
        setProducts(enabledProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [city, category]);

  const handleImageLoad = () => setImagesLoaded(prev => prev + 1);

  useEffect(() => {
    if (imagesLoaded === totalImages) {
      setLoading(false);
    }
  }, [imagesLoaded, totalImages]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCity(inputCity);
    setCategory(inputCategory);
  };

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

  const parseProductStruct = (p) => ({
    id: p[0],
    name: p[1],
    category: p[2],
    price: p[3],
    availableUnits: p[4],
    imageCID: p[5],
    owner: p[6],
    timestamp: p[7],
    status: p[8],
  });

  const parseToCategoryString = (category) => {
    const cat = Number(category);
    switch (cat) {
      case 0: return 'Fashion';
      case 1: return 'Electronics';
      case 2: return 'Furniture';
      case 3: return 'Books';
      case 4: return 'Beauty';
      case 5: return 'Sports';
      default: return 'Others';
    }
  };

  const handleQuantityChange = (productId, value) => {
    setQuantities(prev => ({ ...prev, [productId]: Number(value) }));
  };

  const handleAddToCart = async (product) => {
    const quantity = quantities[product.id] || 1;
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const inventoryRegistryContract = new ethers.Contract(inventoryContractAddress, InventoryRegistryABI, signer);
    
    const rawProduct = await inventoryRegistryContract.getProduct(product.id);
    const tempProduct = parseProductStruct(rawProduct);

    if (quantity < 1 || quantity > tempProduct.availableUnits) {
      alert(`Invalid quantity for ${product.name}, refresh page to see updated stock`);
      return;
    }

    if (cart.length === 0) {
      setCurrentSeller(product.owner);
    } else if (product.owner !== currentSeller) {
      alert("You can only add products from the same seller in one checkout.");
      return;
    }

    const existingItemIndex = cart.findIndex((item) => item.product.id === product.id);
    const productWithLiveData = { ...product, price: tempProduct.price, availableUnits: tempProduct.availableUnits };

    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = { ...updatedCart[existingItemIndex], quantity, product: productWithLiveData };
      setCart(updatedCart);
    } else {
      setCart([...cart, { product: productWithLiveData, quantity }]);
    }

    alert("Added to cart");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const inventoryRegistryContract = new ethers.Contract(inventoryContractAddress, InventoryRegistryABI, signer);
    const orderRegistryContract = new ethers.Contract(orderContractAddress, OrderRegistryABI, provider);

    let updatedCart = [];
    const productIds = [];
    const quantitiesArr = [];

    for (const item of cart) {
      const rawProduct = await inventoryRegistryContract.getProduct(item.product.id);
      const liveProduct = parseProductStruct(rawProduct);

      updatedCart.push({
        product: liveProduct,
        quantity: item.quantity,
      });

      productIds.push(item.product.id);
      quantitiesArr.push(item.quantity);
    }

    try {
      const totalCost = await orderRegistryContract.validate(productIds, quantitiesArr);
      if (totalCost === -1n) {
        alert("Some products are out of stock or unavailable. Please update your cart.");
        return;
      }

      setValidatedCart(updatedCart);
      setTotalAmount(Number(totalCost));
      setBillError('');
      setShowBill(true);
    } catch (err) {
      console.error("Error validating cart:", err);
      setBillError("Error validating cart.");
      setShowBill(true);
    }
  };

  const handlePay = async () => {
    try {
      setIsPaying(true); // Show loading overlay

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const orderRegistryContract = new ethers.Contract(orderContractAddress, OrderRegistryABI, signer);

      const productIds = validatedCart.map(item => item.product.id);
      const quantities = validatedCart.map(item => item.quantity);

      const adjustedAmount = BigInt(totalAmount) * BigInt(1e10);

      const tx = await orderRegistryContract.createOrder(productIds, quantities, {
        value: adjustedAmount,
      });

      await tx.wait();

      alert("Order created successfully! Txn Hash: " + tx.hash);

      setCart([]);
      setValidatedCart([]);
      setShowBill(false);
    } catch (err) {
      console.error("Error during payment/order creation:", err);
      alert("Payment or Order creation failed. Please try again.");
    } finally {
      setIsPaying(false); // Hide loading overlay
    }
  };

  return (
    <BuyerLayout>
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        {/* Filter Bar */}
        <div className="bg-white shadow-md p-4 w-full sticky top-0 z-10">
          <form onSubmit={handleSearchSubmit} className="flex gap-4">
            <input type="text" placeholder="Enter your city" value={inputCity} onChange={(e) => setInputCity(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
            <select value={inputCategory} onChange={(e) => setInputCategory(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
              <option value="">Select Category</option>
              <option value="Fashion">Fashion</option>
              <option value="Electronics">Electronics</option>
              <option value="Furniture">Furniture</option>
              <option value="Books">Books</option>
              <option value="Beauty">Beauty</option>
              <option value="Sports">Sports</option>
            </select>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Search</button>
            <button type="button" onClick={handleCheckout} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Checkout ({cart.length})</button>
          </form>
        </div>

        {loading && (
          <div className="fixed inset-0 z-[100] bg-white/80 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center animate-pulse">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-medium text-blue-700">{loadingMessage}</p>
            </div>
          </div>
        )}

        {isPaying && (
          <div className="fixed inset-0 z-[100] bg-white/80 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center animate-pulse">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-medium text-blue-700">Processing payment...</p>
            </div>
          </div>
        )}


        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10">
          {!loading && products.length === 0 && (
            <p className="text-center text-gray-500">No products found based on your search criteria.</p>
          )}

          {products.map((product) => (
            <div key={product.id} className="border border-gray-300 rounded-lg p-4 bg-white shadow-md">
              <img src={`https://sapphire-important-squid-465.mypinata.cloud/ipfs/${product.imageCID}`} alt={product.name} className="w-full h-64 object-cover rounded-md mb-4" onLoad={handleImageLoad} onError={handleImageLoad} />
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-gray-500">{parseToCategoryString(product.category)}</p>
              <p className="text-xl font-bold mt-2">{product.price} tinybars</p>
              <p className="text-sm text-gray-400">Available: {product.availableUnits}</p>
              <input type="number" min="1" max={product.availableUnits} value={quantities[product.id] || ''} onChange={(e) => handleQuantityChange(product.id, e.target.value)} placeholder="Quantity" className="mt-2 px-2 py-1 border w-full rounded-md" />
              <button onClick={() => handleAddToCart(product)} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-800 text-white py-2 rounded-lg">Add to Cart</button>
            </div>
          ))}
        </div>

        {/* Bill Summary Modal */}
        {showBill && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full space-y-4">
              <h2 className="text-xl font-semibold">Bill Summary</h2>
              {billError ? (
                <p className="text-red-500">{billError}</p>
              ) : (
                <>
                  {validatedCart.map(({ product, quantity }) => (
                    <div key={product.id} className="flex justify-between items-center border-b py-2">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">Unit Price: {product.price} tinybars</p>
                        <p className="text-sm text-gray-500">Qty: {quantity}</p>
                      </div>
                      <p className="font-semibold">  {(product.price * BigInt(quantity)).toString()} tinybars</p>
                    </div>
                  ))}
                  <div className="flex justify-between pt-4 font-bold text-lg border-t mt-4">
                    <span>Live Price</span>
                    <span>{totalAmount} tinybars</span>
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <button onClick={() => setShowBill(false)} className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400">Cancel</button>
                    <button onClick={handlePay} disabled={!!billError || isPaying} className={`px-4 py-2 rounded-md text-white ${billError || isPaying ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>Pay</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}
