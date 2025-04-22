"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import SellerLayout from "@/components/SellerLayout";
import SellerRegistryABI from "@/contracts/SellerRegistryABI.json";
import InventoryRegistryABI from "@/contracts/InventoryRegistryABI.json";
import { CONTRACT_ADDRESSES } from "@/constants/contracts";

const SELLER_REGISTRY_ADDRESS = CONTRACT_ADDRESSES.SellerRegistry;
const INVENTORY_REGISTRY_ADDRESS = CONTRACT_ADDRESSES.InventoryRegistry;

const categoryEnum = ["Fashion", "Electronics", "Furniture", "Books", "Beauty", "Sports"];

export default function InventoryPage() {
  const [wallet, setWallet] = useState(null);
  const [isRegistered, setIsRegistered] = useState(null);
  const [products, setProducts] = useState([]);
  const [originalProducts, setOriginalProducts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        if (window.ethereum) {
          const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
          setWallet(account);

          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          const sellerRegistry = new Contract(SELLER_REGISTRY_ADDRESS, SellerRegistryABI, signer);
          const registered = await sellerRegistry.isRegistered(account);
          setIsRegistered(registered);

          if (!registered) {
            setErrorMessage("You must be a registered seller to view your inventory.");
            setLoading(false);
            return;
          }

          const inventoryRegistry = new Contract(INVENTORY_REGISTRY_ADDRESS, InventoryRegistryABI, signer);
          const sellerProducts = await inventoryRegistry.getProductsBySeller(account);

          const formatted = sellerProducts.map((product) => ({
            id: product.id.toString(),
            name: product.name,
            category: categoryEnum[Number(product.category)],
            price: product.price.toString(),
            stock: product.availableUnits.toString(),
            status: product.status,
            imageCID: product.imageCID,
            releaseDate: new Date(Number(product.releaseDate) * 1000).toLocaleDateString(),
            updated: false,
          }));

          setProducts(formatted);
          setOriginalProducts(formatted);

          if (formatted.length === 0) setLoading(false);
        }
      } catch (error) {
        console.error("Error:", error);
        setErrorMessage("Failed to load inventory.");
        setLoading(false);
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (products.length > 0 && imagesLoaded === products.length) setLoading(false);
  }, [imagesLoaded, products]);

  const handleImageLoad = () => setImagesLoaded((prev) => prev + 1);

  const handleFieldChange = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    updated[index].updated = true;
    setProducts(updated);
  };

  const handleImageChange = async (index, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploadToIPFS", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Upload failed:", data.error);
        return;
      }

      const cid = data.cid;
      handleFieldChange(index, "imageCID", cid);
    } catch (err) {
      console.error("Image upload error:", err);
    }
  };

  const handleUpdate = async (product, index) => {
    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(INVENTORY_REGISTRY_ADDRESS, InventoryRegistryABI, signer);

      const tx = await contract.updateProduct(
        product.id,
        product.name,
        product.category,
        product.price,
        parseInt(product.stock),
        product.imageCID,
        product.status
      );

      await tx.wait();

      alert("Product updated successfully!");

      const updated = [...products];
      updated[index].updated = false;
      setProducts(updated);

      const newOriginals = [...originalProducts];
      newOriginals[index] = { ...product, updated: false };
      setOriginalProducts(newOriginals);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SellerLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-center text-gray-700 mb-8">My Inventory</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-all relative"
            >
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-gray-100 flex items-center justify-center cursor-pointer">
                <img
                  src={`https://sapphire-important-squid-465.mypinata.cloud/ipfs/${product.imageCID}`}
                  alt="Product"
                  className="object-contain w-full h-full"
                  onClick={() => setSelectedImage(product.imageCID)}
                  onLoad={handleImageLoad}
                  onError={handleImageLoad}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id={`image-${index}`}
                  onChange={(e) => handleImageChange(index, e.target.files[0])}
                />
                <button
                  className="absolute top-2 right-2 bg-white p-1 rounded-full shadow-md"
                  onClick={() => document.getElementById(`image-${index}`).click()}
                >
                  ✏️
                </button>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-800">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Name:</span>
                  <input
                    value={product.name}
                    onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                    className="bg-transparent text-right border-none focus:outline-none focus:ring-0"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Price (tinybars):</span>
                  <input
                    type="number"
                    value={product.price}
                    onChange={(e) => handleFieldChange(index, "price", e.target.value)}
                    className="bg-transparent text-right border-none focus:outline-none focus:ring-0"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Stock:</span>
                  <input
                    type="number"
                    value={product.stock}
                    onChange={(e) => handleFieldChange(index, "stock", e.target.value)}
                    className="bg-transparent text-right border-none focus:outline-none focus:ring-0"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <select
                    value={product.status ? "true" : "false"}
                    onChange={(e) => handleFieldChange(index, "status", e.target.value === "true")}
                    className="text-right bg-transparent focus:outline-none"
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>

              {product.updated && (
                <button
                  onClick={() => handleUpdate(product, index)}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
                >
                  Update
                </button>
              )}
            </div>
          ))}
        </div>

        {selectedImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-3xl w-full p-4">
              <img
                src={`https://sapphire-important-squid-465.mypinata.cloud/ipfs/${selectedImage}`}
                className="rounded-lg max-h-[90vh] w-full object-contain"
                alt="Full-size"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 text-white text-2xl bg-black/50 rounded-full px-3 py-1"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="fixed top-6 right-6 z-50">
            <div className="flex items-start gap-3 p-4 rounded-lg shadow-lg text-white bg-red-600">
              <p className="font-medium">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage("")}
                className="text-white hover:text-gray-200 text-xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 z-50 bg-white/80 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center animate-pulse">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-medium text-blue-700">Loading inventory...</p>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
