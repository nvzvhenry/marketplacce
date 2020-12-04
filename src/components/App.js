import React, { Component } from 'react';
import Web3 from 'web3'
import Marketplace from '../abis/Marketplace.json';
import Navbar from './Navbar'
import Main from './Main'

import './App.css';

class App extends Component {

  constructor(){
    super();
    this.state = { 
      account: '',
      productCount: 0,
      products: [],
      loading: true
     };

     this.createProduct = this.createProduct.bind(this);
     this.purchaseProduct = this.purchaseProduct.bind(this);
  }

  async componentDidMount(){
    await this.loadWeb3();
    // console.log(window.web3);
    await this.loadBlockchainData();

  }

  async loadWeb3(){
      //Modern Dapp Browsers
      if (window.ethereum) {
          window.web3 = new Web3(window.ethereum);
          await window.ethereum.enable();
      }
      // Legacy dapp browsers...
      else if (window.web3) {
          window.web3 = new Web3(window.web3.currentProvider);
      }
      // Non-dapp browsers...
      else {
          window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
      }
    }

    async loadBlockchainData() {
      const web3 = window.web3;
      const accounts = await web3.eth.getAccounts();
      this.setState({ account: accounts[0] });

      const networkId = await web3.eth.net.getId();
      const networkData = Marketplace.networks[networkId];
      if(networkData){
        const marketplace = new web3.eth.Contract(Marketplace.abi, networkData.address); 
        this.setState({ marketplace });

        const productCount = await marketplace.methods.productCount().call();
        this.setState({ productCount })
        for(var i = 1; i <= productCount; i++){
          const product = await marketplace.methods.products(i).call();
          this.setState({
            products: [...this.state.products, product]
          })
        }

        this.setState({ loading: false});
      } else{
        window.alert("Marketplace contract not deployed to detected newtwork!")
      }

    }



    createProduct(_name, _price) {
      this.setState({ loading: true});
      this.state.marketplace.methods.createProduct(_name, _price).send({ from: this.state.account })
      .once('receipt', (receipt) => {
        this.setState({ loading: false })
      })
    }

    

    purchaseProduct(_id, _price){
      this.setState({ loading: true });
      this.state.marketplace.methods.purchaseProduct(_id).send({ from: this.state.account, value: _price})
      .once('receipt', (receipt) => {
        this.setState({ loading: false })
      })
    }



  render() 
    {
    return (
      <div>
            <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex">
              { this.state.loading 
                ? <div id="loader" className="text-center"><p className="text-center">loading.....</p></div>
                : <Main 
                      products= {this.state.products}
                      createProduct= {this.createProduct} 
                      purchaseProduct= {this.purchaseProduct} 
                    /> 
                } 
            </main>
          </div>
        </div>
      </div>
    );
  }
}


export default App;
