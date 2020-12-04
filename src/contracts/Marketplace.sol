pragma solidity ^0.5.1;

contract Marketplace {
    string public name;

    struct Product {
        uint id;
        string productName;
        uint price;
        address payable productOwner;
        bool purchased;
    }
    mapping(uint => Product) public products;
    uint public productCount = 0;

    event ProductCreated (
        uint id,
        string productName,
        uint price,
        address payable productOwner,
        bool purchased
    );

     event ProductPurchased (
        uint id,
        string productName,
        uint price,
        address payable productOwner,
        bool purchased
    );


    constructor() public {
        name = "Naz Marketplace";
    }   

    function createProduct(string memory _productName, uint _price) public {
        require(bytes(_productName).length > 0, "Product name can not be empty");
        require(_price > 0, "Product price can not be empty");
        
        //Increment the product count
        productCount++;
        
        //create a product,
        products[productCount] = Product(productCount, _productName, _price, msg.sender, false);
        
        //emit an the product
        emit ProductCreated(productCount, _productName, _price, msg.sender, false);
    }

    function purchaseProduct(uint _id) public payable  {

        //Fetch the product
        Product memory _product = products[_id];
        
        //Fetch the seller
        address payable _seller = _product.productOwner;

        //Make sure the product exists, checks for price,... 
        //...not purchased yet, and can't buy your own product
        require(_product.id > 0 && _product.id <= productCount, "Product does not exist!");
        require(msg.value >= _product.price, "Insufficient amount to purchase");
        require(!_product.purchased, "Product already purchased");
        require(_seller != msg.sender, "You can not buy your own product");
        
        //Transfer Ownership
        _product.productOwner = msg.sender;
        //Update purchased status
        _product.purchased = true;
        //Update the product
        products[_id] = _product;

        //Pay the Seller by transfering some ether.
        address(_seller).transfer(msg.value);

        //emit an event
        emit ProductPurchased(_product.id, _product.productName, _product.price, msg.sender, _product.purchased);

    }        

}