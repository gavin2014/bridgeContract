pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./BridgeStorage.sol";
import "./BridgeAdmin.sol";
import "./BridgeLogic.sol";
import "./ERC20Sample.sol";

contract Bridge is BridgeAdmin, Pausable {

    using SafeMath for uint256;

    string public constant name = "Bridge";
    address public husd;

    BridgeLogic private logic;

    event DepositNative(address indexed from, uint256 value, string targetAddress, string chain);
    event DepositToken(address indexed from, uint256 value, address indexed token, string targetAddress, string chain);
    event WithdrawingNative(address indexed to, uint256 value, string proof);
    event WithdrawingToken(address indexed to, address indexed token, uint256 value, string proof);
    event WithdrawDoneNative(address indexed to, uint256 value, string proof);
    event WithdrawDoneToken(address indexed to, address indexed token, uint256 value, string proof);

    modifier onlyOperator() {
        require(itemAddressExists(OPERATORHASH, msg.sender), "wrong operator");
        _;
    }

    modifier onlyPauser() {
        require(itemAddressExists(PAUSERHASH, msg.sender), "wrong pauser");
        _;
    }


    modifier positiveValue(uint _value) {
        require(_value > 0, "value need > 0");
        _;
    }


    constructor(address[] memory _owners, uint _ownerRequired,address husdAddress) {
        initAdmin(_owners, _ownerRequired);
        husd = husdAddress;
    }

    function depositNative(string memory _targetAddress, string memory  chain) public payable {
        emit DepositNative(msg.sender, msg.value, _targetAddress,chain);
    }

    function depositToken(address _token, uint value, string memory _targetAddress, string memory chain) public {
        ERC20Template erc20 = ERC20Template(_token);
        if (_token == husd){
            erc20.redeem(msg.sender,value);
        }
        else{
            try erc20.burn(msg.sender,value){}
            catch{
            erc20.transferFrom(msg.sender, address(this), value);  
            }
        }
        emit DepositToken(msg.sender, value, _token, _targetAddress, chain);
    }// TODO test it.

    function withdrawNative(address payable to, uint value, string memory proof, bytes32 taskHash) public
    onlyOperator
    whenNotPaused
    positiveValue(value)
    returns(bool)
    {
        require(address(this).balance >= value, "contract has not enough native");
        require(taskHash == keccak256((abi.encodePacked(to,value,proof))),"taskHash is wrong");
        uint256 status = logic.supportTask(logic.WITHDRAWTASK(), taskHash, msg.sender, operatorRequireNum);

        if (status == logic.TASKPROCESSING()){
            emit WithdrawingNative(to, value, proof);
        }else if (status == logic.TASKDONE()) {
            to.transfer(value);
            emit WithdrawingNative(to, value, proof);
            emit WithdrawDoneNative(to, value, proof);
        }
        return true;
    }

    function withdrawToken(address _token, address to, uint value, string memory proof, bytes32 taskHash) public
    onlyOperator
    whenNotPaused
    positiveValue(value)
    returns (bool)
    {
        ERC20Template erc20 = ERC20Template(_token);
        require(erc20.balanceOf(address(this)) >= value, "contract has not enough erc20");
        require(taskHash == keccak256((abi.encodePacked(to,value,proof))),"taskHash is wrong");
        uint256 status = logic.supportTask(logic.WITHDRAWTASK(), taskHash, msg.sender, operatorRequireNum);

        if (status == logic.TASKPROCESSING()){
            emit WithdrawingToken(to, _token, value, proof);
        }else if (status == logic.TASKDONE()) {
            if (_token == husd){//husd only
                erc20.issue(to,value);
            } 
            else{
                try erc20.mint(to,value){}
                catch{
                    erc20.transfer(to, value);  
                } 
            }
            emit WithdrawingToken(to, _token, value, proof);
            emit WithdrawDoneToken(to, _token, value, proof);
        }
        return true;
    }


    function modifyAdminAddress(string memory class, address oldAddress, address newAddress) public whenPaused {
        require(newAddress != address(0x0), "wrong address");
        bool flag = modifyAddress(class, oldAddress, newAddress);
        if(flag){
            bytes32 classHash = keccak256(abi.encodePacked(class));
            if(classHash == LOGICHASH){
                logic = BridgeLogic(newAddress);
            }else if(classHash == STOREHASH){
                logic.resetStoreLogic(newAddress);
            }
        }
    }
    function getLogicAddress() public view returns(address){
        return address(logic);
    }

    function getStoreAddress() public view returns(address){
        return logic.getStoreAddress();
    }

    function pause() public onlyPauser {
        _pause();
    }

    function unpause() public onlyPauser {
        _unpause();
    }

}
