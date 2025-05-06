// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOrderRegistry {
    function getOwner() external view returns (address);
}

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
        bool status;
    }

    uint256 private nextProductId = 1;
    mapping(uint256 => Product) private products;
    mapping(address => uint256[]) private sellerProducts;

    address public immutable escrowOwner;

    event ProductAdded(uint256 productId, address seller);
    event ProductPriceUpdated(uint256 productId, uint256 newPrice);
    event ProductStockChanged(uint256 productId, uint256 newStock);
    event ProductNameUpdated(uint256 productId, string newName);
    event ProductCategoryUpdated(uint256 productId, Category newCategory);
    event ProductImageCIDUpdated(uint256 productId, string newCID);
    event ProductStatusChanged(uint256 productId, bool newStatus);

    constructor(address _escrowOwner) {
        require(_escrowOwner != address(0), "Invalid escrow owner address");
        escrowOwner = _escrowOwner;
    }

    modifier onlyOwnerOrEscrow(uint256 productId) {
        address caller = msg.sender;
        if (products[productId].owner != caller) {
            try IOrderRegistry(caller).getOwner() returns (address orderOwner) {
                require(orderOwner == escrowOwner, "Caller not authorized");
            } catch {
                revert("Caller not product owner or authorized escrow");
            }
        }
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
            releaseDate: block.timestamp,
            status: true
        });

        products[productId] = newProduct;
        sellerProducts[msg.sender].push(productId);

        emit ProductAdded(productId, msg.sender);
    }

    function getProduct(uint256 productId) public view returns (Product memory) {
        require(products[productId].owner != address(0), "Product does not exist");
        return products[productId];
    }

    function updateProduct(
        uint256 productId,
        string memory newName,
        string memory newCategoryStr,
        uint256 newPrice,
        uint256 newStock,
        string memory newImageCID,
        bool newStatus
    ) public onlyOwnerOrEscrow(productId) {
        Product storage product = products[productId];

        if (keccak256(bytes(product.name)) != keccak256(bytes(newName))) {
            product.name = newName;
            emit ProductNameUpdated(productId, newName);
        }

        Category newCategory = parseCategory(newCategoryStr);
        if (product.category != newCategory) {
            product.category = newCategory;
            emit ProductCategoryUpdated(productId, newCategory);
        }

        if (product.price != newPrice) {
            product.price = newPrice;
            emit ProductPriceUpdated(productId, newPrice);
        }

        if (product.availableUnits != newStock) {
            product.availableUnits = newStock;
            emit ProductStockChanged(productId, newStock);
        }

        if (keccak256(bytes(product.imageCID)) != keccak256(bytes(newImageCID))) {
            product.imageCID = newImageCID;
            emit ProductImageCIDUpdated(productId, newImageCID);
        }

        if (product.status != newStatus) {
            product.status = newStatus;
            emit ProductStatusChanged(productId, newStatus);
        }
    }

    function updateProductPrice(uint256 productId, uint256 newPrice) public onlyOwnerOrEscrow(productId) {
        products[productId].price = newPrice;
        emit ProductPriceUpdated(productId, newPrice);
    }

    function changeProductStock(uint256 productId, uint256 newStock) public onlyOwnerOrEscrow(productId) {
        products[productId].availableUnits = newStock;
        emit ProductStockChanged(productId, newStock);
    }

    function changeProductStatus(uint256 productId, bool newStatus) public onlyOwnerOrEscrow(productId) {
        products[productId].status = newStatus;
        emit ProductStatusChanged(productId, newStatus);
    }

    function updateProductName(uint256 productId, string memory newName) public onlyOwnerOrEscrow(productId) {
        require(bytes(newName).length > 0, "Name cannot be empty");
        products[productId].name = newName;
        emit ProductNameUpdated(productId, newName);
    }

    function updateProductImageCID(uint256 productId, string memory newCID) public onlyOwnerOrEscrow(productId) {
        require(bytes(newCID).length > 0, "Image CID cannot be empty");
        products[productId].imageCID = newCID;
        emit ProductImageCIDUpdated(productId, newCID);
    }

    function updateProductCategory(uint256 productId, string memory newCategory) public onlyOwnerOrEscrow(productId) {
        Category categoryEnum = parseCategory(newCategory);
        products[productId].category = categoryEnum;
        emit ProductCategoryUpdated(productId, categoryEnum);
    }

    function parseCategory(string memory category) internal pure returns (Category) {
        bytes32 hashed = keccak256(abi.encodePacked(category));

        if (hashed == keccak256(abi.encodePacked("Fashion"))) return Category.Fashion;
        if (hashed == keccak256(abi.encodePacked("Electronics"))) return Category.Electronics;
        if (hashed == keccak256(abi.encodePacked("Furniture"))) return Category.Furniture;
        if (hashed == keccak256(abi.encodePacked("Books"))) return Category.Books;
        if (hashed == keccak256(abi.encodePacked("Beauty"))) return Category.Beauty;
        if (hashed == keccak256(abi.encodePacked("Sports"))) return Category.Sports;

        revert("Invalid category");
    }

    function isProductIdTaken(uint256 productId) public view returns (bool) {
        return products[productId].owner != address(0);
    }

    function getProductsBySeller(address seller) external view returns (Product[] memory) {
        uint256[] memory ids = sellerProducts[seller];
        Product[] memory result = new Product[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = products[ids[i]];
        }

        return result;
    }

    function getProductsByCategory(Category category) external view returns (Product[] memory) {
        uint256 total = nextProductId - 1;
        uint256 count = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (products[i].owner != address(0) && products[i].category == category) {
                count++;
            }
        }

        Product[] memory result = new Product[](count);
        uint256 j = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (products[i].owner != address(0) && products[i].category == category) {
                result[j++] = products[i];
            }
        }

        return result;
    }

    function getProductsBySellerOfCategory(address seller, Category category) external view returns (Product[] memory) {
        uint256[] memory ids = sellerProducts[seller];
        uint256 count = 0;

        for (uint256 i = 0; i < ids.length; i++) {
            if (products[ids[i]].category == category) {
                count++;
            }
        }

        Product[] memory result = new Product[](count);
        uint256 j = 0;

        for (uint256 i = 0; i < ids.length; i++) {
            if (products[ids[i]].category == category) {
                result[j++] = products[ids[i]];
            }
        }

        return result;
    }

    function getAllProducts() external view returns (Product[] memory) {
        uint256 total = nextProductId - 1;
        uint256 count = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (products[i].owner != address(0)) {
                count++;
            }
        }

        Product[] memory result = new Product[](count);
        uint256 j = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (products[i].owner != address(0)) {
                result[j++] = products[i];
            }
        }

        return result;
    }
}
