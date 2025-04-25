'use client';

import { useEffect, useState } from 'react';
import SellerLayout from '@/components/SellerLayout';
import { ethers, BrowserProvider } from 'ethers';
import OrderRegistryABI from '@/contracts/OrderRegistryABI.json';
import InventoryRegistryABI from '@/contracts/InventoryRegistryABI.json';
import EscrowABI from '@/contracts/EscrowABI.json';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false); // NEW: transaction loading state

  const orderRegistryAddress = CONTRACT_ADDRESSES.OrderRegistry;
  const inventoryRegistryAddress = CONTRACT_ADDRESSES.InventoryRegistry;
  const escrowAddress = CONTRACT_ADDRESSES.Escrow;

  const ORDER_STATES = [
    'CREATED',
    'DISPATCHED',
    'DELIVERED',
    'COMPLETED',
    'RETURN_REQUESTED',
    'RETURN_APPROVED',
    'RETURN_REJECTED',
    'CANCELLED',
  ];

  useEffect(() => {
    const fetchSellerOrders = async () => {
      try {
        setLoading(true);
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const sellerAddress = await signer.getAddress();

        const orderRegistry = new ethers.Contract(orderRegistryAddress, OrderRegistryABI, signer);

        const orderIds = await orderRegistry.getSellerOrders(sellerAddress);
        const fetchedOrders = [];

        for (const id of orderIds) {
          const [
            _id,
            _buyer,
            _seller,
            _totalAmount,
            _createdAt,
            _receivedAt,
            _state,
          ] = await orderRegistry.getOrder(id);

          fetchedOrders.push({
            orderId: Number(_id),
            totalAmount: Number(_totalAmount),
            buyer: _buyer,
            state: ORDER_STATES[_state],
            stateIndex: Number(_state),
            createdAt: new Date(Number(_createdAt) * 1000).toLocaleString(),
            receivedAt: Number(_receivedAt),
          });
        }

        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerOrders();
  }, []);

  const showOrderDetails = async (orderId) => {
    try {
      setSelectedOrderItems([]);
      setShowModal(true);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const orderRegistry = new ethers.Contract(orderRegistryAddress, OrderRegistryABI, signer);
      const inventoryRegistry = new ethers.Contract(inventoryRegistryAddress, InventoryRegistryABI, signer);

      const length = await orderRegistry.getOrderItemsLength(orderId);
      const items = [];

      for (let i = 0; i < length; i++) {
        const [productId, quantity, unitPrice] = await orderRegistry.getOrderItem(orderId, i);
        const product = await inventoryRegistry.getProduct(productId);

        items.push({
          name: product.name,
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
        });
      }

      setSelectedOrderItems(items);
    } catch (error) {
      console.error('Failed to fetch order items:', error);
    }
  };

  const isClaimAvailable = (receivedAt) => {
    if (!receivedAt) return false;
    // const claimEligibleTime = receivedAt * 1000 + 7 * 24 * 60 * 60 * 1000;
    const claimEligibleTime = receivedAt * 1000 + 60 * 1000;

    return Date.now() >= claimEligibleTime;
  };

  const handleTx = async (callback, successMessage, errorMessage) => {
    try {
      setTxLoading(true);
      const tx = await callback();
      await tx.wait();
      alert(successMessage);
      location.reload();
    } catch (err) {
      console.error(`${errorMessage}:`, err);
      alert(errorMessage);
    } finally {
      setTxLoading(false);
    }
  };

  const dispatchOrder = async (orderId) => {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const orderRegistry = new ethers.Contract(orderRegistryAddress, OrderRegistryABI, signer);

    await handleTx(
      () => orderRegistry.dispatchOrder(orderId),
      `Order ${orderId} dispatched.`,
      "Failed to dispatch order."
    );
  };

  const claimFunds = async (orderId) => {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    // const escrow = new ethers.Contract(escrowAddress, EscrowABI, signer);
    const orderRegistry = new ethers.Contract(orderRegistryAddress, OrderRegistryABI, signer);

    await handleTx(
      () => orderRegistry.claimFunds(orderId),
      `Funds claimed for order ${orderId}.`,
      "Failed to claim funds."
    );
  };

  const approveReturn = async (orderId) => {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const orderRegistry = new ethers.Contract(orderRegistryAddress, OrderRegistryABI, signer);

    await handleTx(
      () => orderRegistry.approveReturn(orderId),
      `Return for order ${orderId} approved.`,
      "Failed to approve return."
    );
  };

  const rejectReturn = async (orderId) => {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const orderRegistry = new ethers.Contract(orderRegistryAddress, OrderRegistryABI, signer);

    await handleTx(
      () => orderRegistry.rejectReturn(orderId),
      `Return for order ${orderId} rejected.`,
      "Failed to reject return."
    );
  };

  return (
    <SellerLayout>
      <div className="min-h-screen px-6 py-10 bg-gray-50 relative">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : orders.length === 0 ? (
          <p className="text-gray-500 text-center">No orders yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div key={order.orderId} className="bg-white p-4 rounded-lg shadow border">
                <h2 className="text-lg font-semibold">Order #{order.orderId}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Total: {(order.totalAmount / 1e8).toFixed(3)} HBAR
                </p>
                <p className="text-sm text-gray-600">State: {order.state}</p>
                <p className="text-xs text-gray-400 mt-1">Created: {order.createdAt}</p>
                <button
                  onClick={() => showOrderDetails(order.orderId)}
                  className="mt-4 px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Details
                </button>

                {order.state === 'CREATED' && (
                  <button
                    onClick={() => dispatchOrder(order.orderId)}
                    className="mt-2 px-4 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Dispatch
                  </button>
                )}

                {(order.state === 'DELIVERED' || order.state === 'RETURN_REJECTED') && (
                  <button
                    onClick={() => claimFunds(order.orderId)}
                    disabled={!isClaimAvailable(order.receivedAt)}
                    className={`mt-2 px-4 py-1 text-sm rounded text-white ${
                      isClaimAvailable(order.receivedAt)
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Claim
                  </button>
                )}

                {order.state === 'RETURN_REQUESTED' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => approveReturn(order.orderId)}
                      className="px-4 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectReturn(order.orderId)}
                      className="px-4 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white w-[90%] md:w-[500px] p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold mb-4">Order Details</h3>
              {selectedOrderItems.length === 0 ? (
                <p>Loading items...</p>
              ) : (
                <ul className="space-y-2">
                  {selectedOrderItems.map((item, idx) => (
                    <li key={idx} className="border p-2 rounded-md">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} | Unit Price: {(item.unitPrice / 1e8).toFixed(3)} HBAR
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6 text-right">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1 text-sm bg-gray-300 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {txLoading && (
          <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.3)] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <svg className="animate-spin h-6 w-6 text-blue-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-700">Processing transaction...</p>
          </div>
        </div>
        )}
      </div>
    </SellerLayout>
  );
}
