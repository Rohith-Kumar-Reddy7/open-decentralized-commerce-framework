// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IInventoryRegistry {
    function getProduct(uint256 productId) external view returns (
        uint256 id,
        string memory name,
        uint8 category,
        uint256 price,
        uint256 availableUnits,
        string memory imageCID,
        address owner,
        uint256 releaseDate,
        bool status
    );

    function changeProductStock(uint256 productId, uint256 newStock) external;
}

interface IEscrow {
    function pay(uint256 orderId) external payable;
    function refund(uint256 orderId) external;
    function claim(uint256 orderId) external;
}

contract OrderRegistry {
    enum OrderState { CREATED, DISPATCHED, DELIVERED, COMPLETED, RETURN_REQUESTED, RETURN_APPROVED, RETURN_REJECTED, CANCELLED }

    struct OrderItem {
        uint256 productId;
        uint256 quantity;
        uint256 unitPrice;
    }

    struct Order {
        uint256 id;
        address buyer;
        address seller;
        OrderItem[] items;
        uint256 totalAmount;
        OrderState state;
        uint256 createdAt;
        uint256 receivedAt;
    }

    address public owner;
    address public inventoryRegistryAddress;
    address public escrowAddress;
    uint256 private nextOrderId = 1;

    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public sellerOrders;
    mapping(address => uint256[]) public buyerOrders;

    event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 totalAmount);
    event OrderCancelled(uint256 indexed orderId);
    event OrderDispatched(uint256 indexed orderId);
    event OrderDelivered(uint256 indexed orderId);
    event ReturnRequested(uint256 indexed orderId);
    event ReturnApproved(uint256 indexed orderId);
    event ReturnRejected(uint256 indexed orderId);
    event FundsClaimed(uint256 indexed orderId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlyBuyer(uint256 orderId) {
        require(orders[orderId].buyer == msg.sender, "Not the buyer of this order");
        _;
    }

    modifier onlySeller(uint256 orderId) {
        require(orders[orderId].seller == msg.sender, "Not the seller of this order");
        _;
    }

    constructor(address _inventoryRegistryAddress, address _escrowAddress) {
        owner = msg.sender;
        inventoryRegistryAddress = _inventoryRegistryAddress;
        escrowAddress = _escrowAddress;
    }

    function updateInventoryRegistryAddress(address newAddress) external onlyOwner {
        require(newAddress != address(0), "Invalid address");
        inventoryRegistryAddress = newAddress;
    }

    // function updateEscrowAddress(address newAddress) external onlyOwner {
    //     require(newAddress != address(0), "Invalid address");
    //     escrowAddress = newAddress;
    // }

    function getOwner() external view returns (address) {
        return owner;
    }

    function validate(uint256[] memory productIds, uint256[] memory quantities) public view returns (int256) {
        require(productIds.length == quantities.length, "Length mismatch");

        uint256 totalCost = 0;

        for (uint i = 0; i < productIds.length; i++) {
            (,, , uint256 price, uint256 availableUnits,, , , bool status) =
                IInventoryRegistry(inventoryRegistryAddress).getProduct(productIds[i]);

            if (!status || availableUnits < quantities[i]) {
                return -1;
            }
            totalCost += price * quantities[i];
        }

        return int256(totalCost);
    }

    function createOrder(
        uint256[] memory productIds,
        uint256[] memory quantities
    ) external payable {
        require(productIds.length == quantities.length, "Length mismatch");

        address buyer = msg.sender;
        uint256 totalAmount = 0;
        address seller;

        uint256 orderId = nextOrderId++;
        OrderItem[] memory orderItems = new OrderItem[](productIds.length);

        for (uint i = 0; i < productIds.length; i++) {
            (,, , uint256 price, uint256 availableUnits,, address productOwner,, bool status) =
                IInventoryRegistry(inventoryRegistryAddress).getProduct(productIds[i]);

            if (!status || availableUnits < quantities[i]) {
                revert("Product unavailable or insufficient stock");
            }

            if (i == 0) seller = productOwner;

            orderItems[i] = OrderItem(productIds[i], quantities[i], price);
            totalAmount += price * quantities[i];
        }

        require(msg.value == totalAmount, "Incorrect payment amount");

        Order storage newOrder = orders[orderId];
        newOrder.id = orderId;
        newOrder.buyer = buyer;
        newOrder.seller = seller;
        newOrder.totalAmount = totalAmount;
        newOrder.state = OrderState.CREATED;
        newOrder.createdAt = block.timestamp;

        for (uint i = 0; i < orderItems.length; i++) {
            newOrder.items.push(orderItems[i]);
        }

        try IEscrow(escrowAddress).pay{value: msg.value}(orderId) {
            buyerOrders[buyer].push(orderId);
            sellerOrders[seller].push(orderId);

            for (uint i = 0; i < productIds.length; i++) {
                (, , , , uint256 availableUnits,, , , ) = IInventoryRegistry(inventoryRegistryAddress).getProduct(productIds[i]);
                IInventoryRegistry(inventoryRegistryAddress).changeProductStock(productIds[i], availableUnits - quantities[i]);
            }
            emit OrderCreated(orderId, buyer, seller, totalAmount);
        } catch {
            delete orders[orderId];
            revert("Escrow payment failed, order reverted");
        }
    }

    function cancelOrder(uint256 orderId) external onlyBuyer(orderId) {
        Order storage order = orders[orderId];
        require(order.state == OrderState.CREATED, "Order cannot be cancelled");
        order.state = OrderState.CANCELLED;
        IEscrow(escrowAddress).refund(orderId);
        emit OrderCancelled(orderId);
    }

    function dispatchOrder(uint256 orderId) external onlySeller(orderId) {
        Order storage order = orders[orderId];
        require(order.state == OrderState.CREATED, "Order cannot be dispatched");
        order.state = OrderState.DISPATCHED;
        emit OrderDispatched(orderId);
    }

    function receivedOrder(uint256 orderId) external onlyBuyer(orderId) {
        Order storage order = orders[orderId];
        require(order.state == OrderState.DISPATCHED, "Order cannot be marked delivered");
        order.state = OrderState.DELIVERED;
        order.receivedAt = block.timestamp;
        emit OrderDelivered(orderId);
    }

    function requestReturn(uint256 orderId) external onlyBuyer(orderId) {
        Order storage order = orders[orderId];
        require(order.state == OrderState.DELIVERED, "Order must be delivered to request return");
        order.state = OrderState.RETURN_REQUESTED;
        emit ReturnRequested(orderId);
    }

    function approveReturn(uint256 orderId) external onlySeller(orderId) {
        Order storage order = orders[orderId];
        require(order.state == OrderState.RETURN_REQUESTED, "Return not requested");
        order.state = OrderState.RETURN_APPROVED;
        IEscrow(escrowAddress).refund(orderId);
        emit ReturnApproved(orderId);
    }

    function rejectReturn(uint256 orderId) external onlySeller(orderId) {
        Order storage order = orders[orderId];
        require(order.state == OrderState.RETURN_REQUESTED, "Return not requested");
        order.state = OrderState.RETURN_REJECTED;
        emit ReturnRejected(orderId);
    }

    function claimFunds(uint256 orderId) external onlySeller(orderId) {
        Order storage order = orders[orderId];
        require(
            order.state == OrderState.DELIVERED || order.state == OrderState.RETURN_REJECTED,
            "Funds can only be claimed if order is delivered or return rejected"
        );
        require(block.timestamp >= order.receivedAt + 7 days, "Claim window not reached");
        order.state = OrderState.COMPLETED;
        IEscrow(escrowAddress).claim(orderId);
        emit FundsClaimed(orderId);
    }

    function getOrder(uint256 orderId) external view returns (
        uint256 id,
        address buyer,
        address seller,
        uint256 totalAmount,
        uint256 createdAt,
        uint256 receivedAt,
        uint8 state
    ) {
        Order storage order = orders[orderId];
        return (
            order.id,
            order.buyer,
            order.seller,
            order.totalAmount,
            order.createdAt,
            order.receivedAt,
            (uint8)(order.state) 
        );
    }

    function getOrderItem(uint256 orderId, uint256 index) external view returns (
        uint256 productId,
        uint256 quantity,
        uint256 unitPrice
    ) {
        OrderItem storage item = orders[orderId].items[index];
        return (item.productId, item.quantity, item.unitPrice);
    }

    function getOrderItemsLength(uint256 orderId) external view returns (uint256) {
        return orders[orderId].items.length;
    }

    function getBuyerOrders(address buyer) external view returns (uint256[] memory) {
        return buyerOrders[buyer];
    }

    function getSellerOrders(address seller) external view returns (uint256[] memory) {
        return sellerOrders[seller];
    }
}
