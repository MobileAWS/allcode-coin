var SafeMath = artifacts.require("./SafeMath.sol");
var AllCodeCoin = artifacts.require("./AllCodeCoin.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");


module.exports = function(deployer) {

	//owner of the crowdsale
	var owner = web3.eth.accounts[0];

	//wallet where the ehter will get deposited
	var wallet = web3.eth.accounts[1];

	console.log("Owner address: " + owner);	
	console.log("Wallet address: " + wallet);	

	//deploy SafeMath from the owner of the crowdsale
	deployer.deploy(SafeMath, { from: owner });

	//link SafeMath to AllCodeCoin
	deployer.link(SafeMath, AllCodeCoin);

	//deploy the AllCodeCoin using the owner account
	return deployer.deploy(AllCodeCoin, { from: owner }).then(function() {
		//log the address of the AllCodeCoin 
		console.log("AllCodeCoin address: " + AllCodeCoin.address);

		//deploy the Crowdsale 
		return deployer.deploy(Crowdsale, AllCodeCoin.address, wallet, { from: owner }).then(function() {
			console.log("Crowdsale address: " + Crowdsale.address);
			return AllCodeCoin.deployed().then(function(coin) {
				return coin.owner.call().then(function(owner) {
					console.log("AllCodeCoin owner : " + owner);
					return coin.transferOwnership(Crowdsale.address, {from: owner}).then(function(txn) {
						console.log("AllCodeCoin owner was changed: " + Crowdsale.address);		
					});
				})
			});
		});
	});
};