pragma solidity =0.6.6;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
//import "@openzeppelin/contracts/token/ERC20/ERC20Pausable.sol";

contract normalERC20 is ERC20 {

    constructor(string memory name, string memory symbol,uint8 decimal,address tokenowner,uint256 value) public ERC20(name,symbol) {
        _setupDecimals(decimal);
        _mint(tokenowner, value);
    }

}