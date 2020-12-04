const { assert } = require("chai");

require("chai")
    .use(require("chai-as-promised"))
    .should();

const Marketplace = artifacts.require("Marketplace");

contract("Marketplace", ([deployer, seller, buyer]) => {
    let marketplace;

    before("Each Deployment", async () => {
        marketplace = await Marketplace.deployed();
    })



    describe("Deployment", async () => {

        it("deployed successfully", async () => {
            const address = marketplace.address;
            assert.notEqual(address, 0x0);
            assert.notEqual(address, "");
            assert.notEqual(address, null);
            assert.notEqual(address, undefined);    
        })

        it("has a name", async () => {
            const name = await marketplace.name();
            assert.equal(name, "Naz Marketplace");
        })
    })

    

    describe("Products", async () => {
        let result, productCount;
        
        before(async () => {
            result = await marketplace.createProduct("iPhone 11 PRO MAX", web3.utils.toWei('1', 'ether'), { from: seller });
            productCount = await marketplace.productCount();
        })

        it("product created", async () => {
            //Success
            assert.equal(productCount, 1);
            const event = result.logs[0].args;
            // console.log(event);
            assert.equal(event.id.toNumber(), productCount.toNumber(), "ID is correct");
            assert.equal(event.productName, "iPhone 11 PRO MAX", "Product Name is valid");
            assert.equal(event.price, "1000000000000000000", "Price is correct");
            assert.equal(event.productOwner, seller, "Address is correct");
            assert.equal(event.purchased, false, "Product not sold yet");


            //Failure: Product must have a name
            await marketplace.createProduct("", web3.utils.toWei('1', 'ether'), { from: seller }).should.be.rejected;
            //Failure: Product must have a price
            await marketplace.createProduct("iPhone 11 PRO MAX", 0, { from: seller }).should.be.rejected;
        })

        it("lists products", async () => {
            const product = await marketplace.products(productCount);

            assert.equal(product.id.toNumber(), productCount.toNumber(), "ID is correct");
            assert.equal(product.productName, "iPhone 11 PRO MAX", "Product Name is valid");
            assert.equal(product.price, "1000000000000000000", "Price is correct");
            assert.equal(product.productOwner, seller, "Address is correct");
            assert.equal(product.purchased, false, "Product not sold yet");
        })

        it("sells products", async () => {
            //Track oldSeller balance 
            let oldSellerBal;
            oldSellerBal = await web3.eth.getBalance(seller);
            oldSellerBal = Number(new web3.utils.BN(oldSellerBal).toString());

            //Get the function result
            const result = await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'ether') });
            
            //get event from contract emit and validate details
            const event = result.logs[0].args;
            // console.log(event);
            assert.equal(event.id.toNumber(), productCount.toNumber(), "ID is correct");
            assert.equal(event.productName, "iPhone 11 PRO MAX", "Product Name is valid");
            assert.equal(event.price, "1000000000000000000", "Price is correct");
            assert.equal(event.productOwner, buyer, "Address is correct");
            assert.equal(event.purchased, true, "Product not sold yet");

            //Track newSeller balance
            let newSellerBal, price;
            newSellerBal = await web3.eth.getBalance(seller);
            newSellerBal = Number(new web3.utils.BN(newSellerBal).toString());

            price = web3.utils.toWei('1', 'ether');
            price = Number(new web3.utils.BN(price).toString());
            
            // console.log((oldSellerBal + price), newSellerBal);
            //Assert that the right amount is received 
            assert.equal(newSellerBal, (oldSellerBal + price), "Complete amount received");


            //Failure: tries to buy a product that does not exits i.e must have a valid id
            await marketplace.purchaseProduct(99, { from: buyer, value: web3.utils.toWei('1', 'ether') }).should.be.rejected;
            
            //Failure: tries to buy a product without enough ether.
            await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('0.5', 'ether') }).should.be.rejected;

            //Failure: deployer tries to buy a product after it has been bought.
            await marketplace.purchaseProduct(productCount, { from: deployer, value: web3.utils.toWei('1', 'ether') }).should.be.rejected;

            //Failure: the buyer can't buy the product again.
            await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'ether') }).should.be.rejected;



       
        })
        
    })
})