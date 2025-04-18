// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SellerRegistry {

    struct Seller {
        string businessName;
        string ownerName;
        address wallet;
        string phone;
        string email;
        string city;
        string locationAddress;
    }

    mapping(address => Seller) private sellers;
    address[] private sellerAddresses;

    // Register a seller
    function registerSeller(
        string memory _businessName,
        string memory _ownerName,
        string memory _phone,
        string memory _email,
        string memory _city,
        string memory _locationAddress
    ) public {
        require(!isRegistered(msg.sender), "Seller already registered");

        Seller memory newSeller = Seller({
            businessName: _businessName,
            ownerName: _ownerName,
            wallet: msg.sender,
            phone: _phone,
            email: _email,
            city: _city,
            locationAddress: _locationAddress
        });

        sellers[msg.sender] = newSeller;
        sellerAddresses.push(msg.sender);
    }

    // Check if a wallet address is already registered
    function isRegistered(address _seller) public view returns (bool) {
        return sellers[_seller].wallet != address(0);
    }

    // Return all sellers
    function getAllSellers() public view returns (Seller[] memory) {
        Seller[] memory result = new Seller[](sellerAddresses.length);
        for (uint i = 0; i < sellerAddresses.length; i++) {
            result[i] = sellers[sellerAddresses[i]];
        }
        return result;
    }

    // Return sellers by city
    function getSellersByCity(string memory _city) public view returns (Seller[] memory) {
        uint count = 0;

        // First pass: count how many match
        for (uint i = 0; i < sellerAddresses.length; i++) {
            if (keccak256(abi.encodePacked(sellers[sellerAddresses[i]].city)) == keccak256(abi.encodePacked(_city))) {
                count++;
            }
        }

        // Second pass: collect matches
        Seller[] memory filtered = new Seller[](count);
        uint j = 0;
        for (uint i = 0; i < sellerAddresses.length; i++) {
            if (keccak256(abi.encodePacked(sellers[sellerAddresses[i]].city)) == keccak256(abi.encodePacked(_city))) {
                filtered[j++] = sellers[sellerAddresses[i]];
            }
        }

        return filtered;
    }

    // Get a single seller's details
    function getSeller(address _seller) public view returns (Seller memory) {
        require(isRegistered(_seller), "Seller not found");
        return sellers[_seller];
    }
}
