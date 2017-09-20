pragma solidity ^0.4.11;

import "./StandardToken.sol";
import "./Ownable.sol";


/**
 *  AllCodeCoin token contract. Implements
 */
contract AllCodeCoin is StandardToken, Ownable {
  string public constant name = "AllCodeCoin";
  string public constant symbol = "ALLC";
  uint public constant decimals = 6;


  // Constructor
  function AllCodeCoin() {
      totalSupply = 1000000000000000;
      balances[msg.sender] = totalSupply; // Send all tokens to owner
  }

  /**
   *  Burn away the specified amount of AllCodeCoin tokens
   */
  function burn(uint _value) onlyOwner returns (bool) {
    balances[msg.sender] = balances[msg.sender].sub(_value);
    totalSupply = totalSupply.sub(_value);
    Transfer(msg.sender, 0x0, _value);
    return true;
  }

}






