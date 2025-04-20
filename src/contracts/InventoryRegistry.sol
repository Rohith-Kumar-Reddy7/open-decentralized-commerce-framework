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
        uint256 id;
        string name;
        Category category;
        uint256 price;
        uint256 availableUnits;
        string imageCID;
        address owner;
        uint256 releaseDate;
    }

    uint256 private nextProductId = 1;

    mapping(uint256 => Product) public products;
    mapping(address => uint256[]) private sellerProducts;

    event ProductAdded(uint256 productId, address seller);
    event ProductPriceUpdated(uint256 productId, uint256 newPrice);
    event ProductStockIncreased(uint256 productId, uint256 addedUnits);

    modifier onlyOwner(uint256 productId) {
        require(products[productId].owner == msg.sender, "Not the product owner");
        _;
    }

    function addProduct(
        string memory name,
        Category category,
        uint256 price,
        uint256 availableUnits,
        string memory imageCID
    ) public {
        uint256 productId = nextProductId++;

        Product memory newProduct = Product({
            id: productId,
            name: name,
            category: category,
            price: price,
            availableUnits: availableUnits,
            imageCID: imageCID,
            owner: msg.sender,
            releaseDate: block.timestamp
        });

        products[productId] = newProduct;
        sellerProducts[msg.sender].push(productId);

        emit ProductAdded(productId, msg.sender);
    }

    function getProductsBySeller(address seller) external view returns (Product[] memory) {
        uint256[] memory ids = sellerProducts[seller];
        Product[] memory result = new Product[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = products[ids[i]];
        }

        return result;
    }

    function updateProductPrice(uint256 productId, uint256 newPrice) public onlyOwner(productId) {
        products[productId].price = newPrice;
        emit ProductPriceUpdated(productId, newPrice);
    }

    function increaseProductStock(uint256 productId, uint256 addedUnits) public onlyOwner(productId) {
        products[productId].availableUnits += addedUnits;
        emit ProductStockIncreased(productId, addedUnits);
    }

    function isProductIdTaken(uint256 productId) public view returns (bool) {
        return products[productId].owner != address(0);
    }
}
