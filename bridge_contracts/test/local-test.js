const { expect } = require("chai");
const abi = require('ethereumjs-abi');
const { ethers, waffle } = require("hardhat");
const abiDecoder = require('abi-decoder');
const { default: func } = require("../deploy/000_deploy_bridge");
const { utils } = require("ethers");



describe("HecoBridge", function() {
    //address
    var owner1, owner2, owner3,deployer,operator1,operator2,tester1;
    var husd,bridge,logic,store,erc20factory;
    //
    const provider = waffle.provider;

    beforeEach("set up",async function(){
        [owner1,owner2,owner3,deployer,operator1,operator2,tester1,tester2] = await ethers.getSigners();
        //deploy husd first
        const HUSD = await ethers.getContractFactory("HUSD",deployer);
        husd = await HUSD.deploy("husd","husd",6);
        await husd.deployed();


        const Bridge = await ethers.getContractFactory("Bridge",deployer);
        bridge=await Bridge.deploy([owner1.address,owner2.address,owner3.address],1,husd.address);
        await bridge.deployed();

        const BridgeLogic = await ethers.getContractFactory("BridgeLogic",deployer);
        logic =await BridgeLogic.deploy(bridge.address);
        await logic.deployed();

        const BridgeStore = await ethers.getContractFactory("BridgeStorage",deployer);
        store = await BridgeStore.deploy(logic.address);
        await store.deployed();

        //deploy factory, deployer as owner
        const Factory  =await ethers.getContractFactory("ERC20Factory",deployer);
        erc20factory = await Factory.deploy(deployer.address);
        await erc20factory.deployed();

    //link contracts
        var txhash = await bridge.connect(owner1).pause();
        await txhash.wait();
        expect(await bridge.connect(owner1).paused());  
    
    
        txhash = await bridge.connect(owner1).modifyAdminAddress("logic",store.address,logic.address);
        await txhash.wait();
        var res = await bridge.connect(owner1).getLogicAddress();
        expect(res,logic.address);
        
        txhash = await bridge.connect(owner1).modifyAdminAddress("store",logic.address,store.address);
        await txhash.wait();
        res = await bridge.connect(owner1).getStoreAddress();
        expect(res,store.address);
        
        // add two operator
        let tx1 = await bridge.connect(owner1).addAddress("operator",operator1.address);
        await tx1.wait();
        let tx2 = await bridge.connect(owner1).addAddress("operator",operator2.address);
        await tx2.wait();
        expect([operator1.address,operator2.address],await bridge.connect(owner1).getAdminAddresses("operator"));
    
        // //done all, change to upaused.
        txhash = await bridge.connect(owner1).unpause();
        await txhash.wait();

        // add ownership to bridge
        txhash = await husd.connect(deployer).addCoinFactoryAdmin(bridge.address);
        await txhash.wait();
        expect(await husd.connect(deployer).isCoinFactoryAdmin(bridge.address));
        

    
    });
    
    
    it("test deopsit Native", async function(){
        console.log("test deopsit native");
        let depositEvent = new Promise((resolve,reject)=>{
            bridge.on("DepositNative",(from,value,targetAddress,chain)=>{
                resolve({
                    from: from,
                    value: value,
                    to:targetAddress,
                    chain:chain,
                });
            });
            setTimeout(() => {
                reject(new Error('timeout'));
            }, 60000)
        });


        let overvide = {
            value : ethers.utils.parseEther("1.0")
        }
        let tx = await bridge.connect(tester1).depositNative(tester2.address,"houchain",overvide);
        
        let event = await depositEvent;
        expect(event.from,tester1.address);
        expect(event.to, tester2.address);
        expect(event.chain, "houchain");
        console.log(event.value.toString());



    });

    it("test deopsit factoryERC20", async function(){
        console.log("test deopsit factory Token");

        let tx = await erc20factory.connect(deployer).createToken(deployer.address,deployer.address,"hou","hou",6);
        token_address = await erc20factory.allTokens(0);
        //  mint some to tester1
        token = await ethers.getContractAt("ERC20test",token_address);
        let tx2 =await  token.connect(deployer).mint(tester1.address,10000);
        expect(token.balanceOf(tester1.address),10000);
        
        // trasnfer token ownership to bridge 

        let tx3 = await erc20factory.connect(deployer).changeTokenUser(token_address,bridge.address,bridge.address);



        let depositEvent = new Promise((resolve,reject)=>{
            bridge.on("DepositToken",(from,value,tokenadd,targetAddress,chain)=>{
                resolve({
                    token :tokenadd,
                    from: from,
                    value: value,
                    to:targetAddress,
                    chain:chain,
                });
            });
            setTimeout(() => {
                reject(new Error('timeout'));
            }, 60000)
        });


        //no need allow.
        let tx4 = await bridge.connect(tester1).depositToken(token_address,100,tester2.address,"houchain");
        
        let event = await depositEvent;
        // console.log(depositEvent);

        expect(event.from,tester1.address);
        expect(event.to, tester2.address);
        expect(event.chain, "houchain");
        expect(event.token, token_address);

        // console.log((await token.balanceOf(tester1.address)).toString());
        // console.log((await token.totalSupply()).toString());

    });


    

    // it("deposit eth test", async function() {
    //     const encoded = web3.utils.toHex(abi.simpleEncode("depositETH(address)", "0x1071d00d657e73feb1a18bb47d65cabf7fcab4a8"));
    //     const tx = await addr1.sendTransaction({
    //         to: hecoBridge.address,
    //         value: 1,
    //         data:encoded
    //     });

    //     const receipt = await provider.getTransactionReceipt(tx.hash);
    //     abiDecoder.addABI(hecoBridgeAbi);
    //     const decodeLogs = abiDecoder.decodeLogs(receipt.logs);
    //     console.log(JSON.stringify(decodeLogs));
    //     const balance = provider.getBalance(hecoBridge.address);
    //     expect(decodeLogs[0].name, "DepositETH");
    //     expect(decodeLogs[0].events[0].value, "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
    //     expect(decodeLogs[0].events[1].value, "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
    //     expect(decodeLogs[0].events[2].value, "0x1071d00d657e73feb1a18bb47d65cabf7fcab4a8");
    //     expect(balance, BigNumber.from(1));

    // });
});