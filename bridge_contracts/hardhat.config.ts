require("@nomiclabs/hardhat-waffle");
import 'hardhat-deploy';
import {HardhatUserConfig} from 'hardhat/types';
import 'dotenv/config';
import {account_getter,contract_getter,node_url, deployer} from './utils/utils';

import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import { sign } from 'crypto';
import { assert } from 'console';
const fs = require('fs')

task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

task ("inithusd","add ownership to bridge", async (args,hre)=>{
  let url = node_url();
  let provider = new hre.ethers.providers.JsonRpcProvider(url);
  const husd = await hre.ethers.getContractAt("HUSD",contract_getter("HUSD"));
  var signer1 = new hre.ethers.Wallet(deployer(),provider);
  var bridge_address =contract_getter("Bridge"); 

  if(await husd.connect(signer1).isCoinFactoryAdmin(bridge_address) ){
    //in already.
    console.log("have ownership already");
  }
  else{

    let txhash = await husd.connect(signer1).addCoinFactoryAdmin(bridge_address);
    await txhash.wait();
    console.log("tx hash:",txhash.hash);
    console.log("Bridge Address:",bridge_address);
    let res = await husd.connect(signer1).isCoinFactoryAdmin(bridge_address);
    console.log("the result of addation is :", res);
  }
});

task ("initbridge","link these contracts", async (args,hre)=>{
  let url = node_url();
  let provider = new hre.ethers.providers.JsonRpcProvider(url);

  var signer1 = new hre.ethers.Wallet(account_getter("SIGNER1_PRIVATE"),provider);
  
  const bridge = await hre.ethers.getContractAt("Bridge",contract_getter("Bridge"));
  var logic = await contract_getter("BridgeLogic");
  var store = await  contract_getter("BridgeStorage");
  console.log("logic address:",logic);

  if(await bridge.connect(signer1).paused()==true){
    console.log("paused. no need to puase");
  }
  else{
    let txhash = await bridge.connect(signer1).pause();
    await txhash.wait();
    console.log("change into pause, hash:",txhash.hash);
    assert(await bridge.connect(signer1).paused()); 
  }


  if(await bridge.connect(signer1).getLogicAddress()==logic ){
    console.log("logic set already");
  }
  else{
   let txhash = await bridge.connect(signer1).modifyAdminAddress("logic",store,logic);
   console.log("setting logic txhash:", txhash.hash);
   await txhash.wait();
   let res = await bridge.connect(signer1).getLogicAddress();
   assert(res==logic);
  }
  if(await bridge.connect(signer1).getStoreAddress()==store ){
    console.log(" store set already");
  }
  else{
   let txhash = await bridge.connect(signer1).modifyAdminAddress("store",logic,store);
   console.log("setting store txhash:", txhash.hash);
   await txhash.wait();
   let res = await bridge.connect(signer1).getStoreAddress();
   assert(res==store);
  } 
  // add two operator
  if((await bridge.connect(signer1).getAdminAddresses("operator")).length == 2){
    console.log("existed two operator already");
  }
  else{
    const operator1 = account_getter("OPERATOR1");
    const operator2 = account_getter("OPERATOR2");
    let tx1 = await bridge.connect(signer1).addAddress("operator",operator1);
    await tx1.wait();
    let tx2 = await bridge.connect(signer1).addAddress("operator",operator2);
    await tx2.wait();

    console.log("operator setting \n",tx1.hash,"\n",tx2.hash);
    assert([operator1,operator2],await bridge.connect(signer1).getAdminAddresses("operator"));

  }
  //done all, change to upaused.

  let txhash = await bridge.connect(signer1).unpause();
  await txhash.wait();
  console.log("change into unpause, hash:",txhash.hash);
  assert(!await bridge.connect(signer1).paused()); 
});





const config: HardhatUserConfig = {
  solidity: {
    compilers:[
      {
        version:"0.7.1",
        settings:{
          evmVersion:"istanbul",
          optimizer: {
            enabled: false,
            runs: 0
          }
        }
      },
      {
        version:"0.5.16",
        settings:{
          evmVersion:"istanbul",
          optimizer: {
            enabled: false,
            runs: 0
          } 
        }
      },
      {
        version:"0.6.6",
        settings:{
          evmVersion:"istanbul",
          optimizer: {
            enabled: false,
            runs: 0
          } 
        }
      }
    ]
  },
  namedAccounts: {
    deployer: deployer(),
  },
  networks: {
    hardhat: {
    },
    localhost: {
      url: 'http://localhost:8545',
    },
    heco_chaintest: {
      // url: node_url("HECO"),
      url: "https://http-testnet.hecochain.com",
    },
  },
 }
export default config;