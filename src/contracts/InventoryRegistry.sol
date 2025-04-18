// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract InventoryRegistry {
    enum Category {
        Fashion,
        Electronics,
        Furniture,
        Books,
        Beauty,
        Sports
    }

    struct Product {
        string name;
        Category category;
        uint256 price;
        uint256 availableUnits;
        string imageCID;
        address owner;
        uint256 releaseDate;  // The timestamp when the product is added
    }

    // Mapping from product ID to Product
    mapping(string => Product) public products;

    // Mapping from seller address to list of product IDs
    mapping(address => string[]) private sellerProducts;

    // Events
    event ProductAdded(string productId, address seller);
    event ProductPriceUpdated(string productId, uint256 newPrice);
    event ProductStockIncreased(string productId, uint256 addedUnits);

    modifier onlyOwner(string memory productId) {
        require(products[productId].owner == msg.sender, "Not the product owner");
        _;
    }

    // Add a new product
    function addProduct(
        string memory productId,
        string memory name,
        Category category,
        uint256 price,
        uint256 availableUnits,
        string memory imageCID
    ) public {
        require(products[productId].owner == address(0), "Product ID already used");

        // Set the release date to the current timestamp
        uint256 releaseDate = block.timestamp;

        Product memory newProduct = Product({
            name: name,
            category: category,
            price: price,
            availableUnits: availableUnits,
            imageCID: imageCID,
            owner: msg.sender,
            releaseDate: releaseDate
        });

        products[productId] = newProduct;
        sellerProducts[msg.sender].push(productId);

        emit ProductAdded(productId, msg.sender);
    }

    // Get all products for a seller
    function getProductsBySeller(address seller) external view returns (Product[] memory) {
        string[] memory ids = sellerProducts[seller];
        Product[] memory result = new Product[](ids.length);

        for (uint i = 0; i < ids.length; i++) {
            result[i] = products[ids[i]];
        }

        return result;
    }

    // Update the price of a product
    function updateProductPrice(
        string memory productId,
        uint256 newPrice
    ) public onlyOwner(productId) {
        Product storage p = products[productId];
        p.price = newPrice;

        emit ProductPriceUpdated(productId, newPrice);
    }

    // Increase the stock (available units) of a product
    function increaseProductStock(
        string memory productId,
        uint256 addedUnits
    ) public onlyOwner(productId) {
        Product storage p = products[productId];
        p.availableUnits += addedUnits;

        emit ProductStockIncreased(productId, addedUnits);
    }

    // Check if product ID exists (for UUID collision detection on frontend)
    function isProductIdTaken(string memory productId) public view returns (bool) {
        return products[productId].owner != address(0);
    }
}
