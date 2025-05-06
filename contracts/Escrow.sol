// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOrderRegistry {
    function getOrder(uint256 orderId) external view returns (
        uint256 id,
        address buyer,
        address seller,
        uint256 totalAmount,
        uint256 createdAt,
        uint256 receivedAt,
        uint8 state
    );
}

contract Escrow {
    address public owner;
    address public orderRegistryAddress;

    mapping(uint256 => bool) public isPaid;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlyOrderRegistry() {
        require(msg.sender == orderRegistryAddress, "Only OrderRegistry can call");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function getOwner() external view returns (address) {
        return owner;
    }

    function setOrderRegistryAddress(address _orderRegistryAddress) external onlyOwner {
        require(orderRegistryAddress == address(0), "OrderRegistry already set");
        orderRegistryAddress = _orderRegistryAddress;
    }

    function pay(uint256 orderId) external payable onlyOrderRegistry {
        require(orderRegistryAddress != address(0), "OrderRegistry not set");

        IOrderRegistry registry = IOrderRegistry(orderRegistryAddress);
        (
            uint256 id,
            ,
            ,
            uint256 totalAmount,
            ,
            ,
            
        ) = registry.getOrder(orderId);

        require(id == orderId, "Invalid order");
        require(msg.value == totalAmount, "Incorrect payment amount");
        require(!isPaid[orderId], "Already paid");

        isPaid[orderId] = true;
    }

    function refund(uint256 orderId) external onlyOrderRegistry {
        require(isPaid[orderId], "No funds to refund");

        IOrderRegistry registry = IOrderRegistry(orderRegistryAddress);
        (
            ,
            address buyer,
            ,
            uint256 totalAmount,
            ,
            ,
            
        ) = registry.getOrder(orderId);

        isPaid[orderId] = false;
        payable(buyer).transfer(totalAmount);
    }

    function claim(uint256 orderId) external onlyOrderRegistry {
        require(isPaid[orderId], "No funds to claim");

        IOrderRegistry registry = IOrderRegistry(orderRegistryAddress);
        (
            ,
            ,
            address seller,
            uint256 totalAmount,
            ,
            ,
            
        ) = registry.getOrder(orderId);

        isPaid[orderId] = false;
        payable(seller).transfer(totalAmount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
