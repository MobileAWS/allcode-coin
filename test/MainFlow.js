var AllCodeCoin = artifacts.require("./AllCodeCoin.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");

var TOTAL_COINS = 1000000000000000;
var CROWDSALE_CAP = 600000000000000;
var PERIOD_28_DAYS = 28*24*60*60;
var PERIOD_2_DAYS = 2*24*60*60;
var SEND_ETHER =  10000;
var ALLC_PER_ETHER = 6000000000;
var RECEIVE_ALLC_AMOUNT = SEND_ETHER * ALLC_PER_ETHER + ((SEND_ETHER * ALLC_PER_ETHER) / 5); // + 20% bonus

contract('MainFlow', function(accounts) {

  var eth = web3.eth;
  var owner = eth.accounts[0];
  var wallet = eth.accounts[1];
  var buyer = eth.accounts[2];

  function printBalance() {
    const ownerBalance = web3.eth.getBalance(owner);
    const walletBalance = web3.eth.getBalance(wallet);
    const buyerBalance = web3.eth.getBalance(buyer);

    console.log("Owner balance", web3.fromWei(ownerBalance, "ether").toString(), " ETHER");
    console.log("Wallet balance", web3.fromWei(walletBalance, "ether").toString(), " ETHER");
    console.log("Buyer balance", web3.fromWei(buyerBalance, "ether").toString(), " ETHER");
  }


  it("should put 1,000,000,000.000000 AllCodeCoin in the owner account", function() {
    return AllCodeCoin.deployed().then(function(instance) {
      return instance.balanceOf.call(owner);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), TOTAL_COINS, "1,000,000,000.000000 wasn't in the owner account");
    });
  });

  it("Send 600,000,000.000000 AllCodeCoin to Crowdsale contract", function() {
    return AllCodeCoin.deployed().then(function(coin) {
      return coin.transfer(Crowdsale.address, CROWDSALE_CAP, {from: owner}).then(function (txn) {
        return coin.balanceOf.call(Crowdsale.address);
      });
    }).then(function (balance) {
      console.log("Crowdsale balance: " + balance);
      assert.equal(balance.valueOf(), CROWDSALE_CAP, "600,000,000.000000 wasn't in the Crowdsale account");
    });
  });


  it("Start Crowdsale contract", function() {
    return Crowdsale.deployed().then(function(crowd) {

      return crowd.start({from: owner}).then(function() {
        console.log("Crowdsale started");
      });
    });
  });

  it("Buy 100,000,000 coins", function() {
    return Crowdsale.deployed().then(function(crowd) {

        var logCoinsEmitedEvent = crowd.LogCoinsEmited();
        logCoinsEmitedEvent.watch(function(err, result) {
          if (err) {
            console.log("Error event ", err);
            return;
          }
          console.log("LogCoinsEmited event = ",result.args.amount,result.args.from);
        }); 

        var logReceivedETH = crowd.LogReceivedETH();
        logReceivedETH.watch(function(err, result) {
          if (err) {
            console.log("Error event ", err);
            return;
          }
          console.log("LogReceivedETH event = ",result.args.addr,result.args.value);
        }); 

        return crowd.sendTransaction({from: buyer, to: crowd.address, value: web3.toWei(SEND_ETHER, "ether")}).then(function(txn) {
          return AllCodeCoin.deployed().then(function(coin) {
            return coin.balanceOf.call(buyer);
          });
       })
     }).then(function(balance) {
        console.log("Buyer balance: ", balance.valueOf(), " ALLC");
        assert.equal(balance.valueOf(), RECEIVE_ALLC_AMOUNT, RECEIVE_ALLC_AMOUNT + " wasn't in the first account");
     });
  });

  it("Try to reserve the payments {from: buyer}", function() {
    return AllCodeCoin.deployed().then(function(coin) {
      return coin.balanceOf.call(buyer).then(function(balance) {
        return Crowdsale.deployed().then(function(crowd) {
          console.log('Buyer ALLC: ' + balance.valueOf());
          return coin.approveAndCall(crowd.address, balance.valueOf(), {from: buyer}).then(function() {
            assert(false, "Throw was supposed to throw but didn't.");
          })
        }).catch(function(error) {
          console.log("Throw was happened. Test succeeded.");
        });
      });
    });
  });

  it("Try to buy too more coins {from: buyer}", function() {
    return Crowdsale.deployed().then(function(crowd) {
       return crowd.sendTransaction({from: buyer, to: crowd.address, value: web3.toWei(CROWDSALE_CAP/ALLC_PER_ETHER+1, "ether")}).then(function(txn) {
          assert(false, "Throw was supposed to throw but didn't.");
       })
     }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
     });
  });

  it("Buy 6,000 coins without bonus", function() {
    web3.evm.increaseTime(PERIOD_2_DAYS);

    return Crowdsale.deployed().then(function(crowd) {
       return crowd.sendTransaction({from: buyer, to: crowd.address, value: web3.toWei(1, "ether")}).then(function(txn) {
          return AllCodeCoin.deployed().then(function(coin) {
            return coin.balanceOf.call(buyer);
          });
       })
     }).then(function(balance) {
        console.log("Buyer balance: ", balance.valueOf(), " ALLC");
        assert.equal(balance.valueOf(), RECEIVE_ALLC_AMOUNT + ALLC_PER_ETHER, RECEIVE_ALLC_AMOUNT + ALLC_PER_ETHER + " wasn't in the first account");
     });
  });

  it("Try to burn coins", function() {
    return AllCodeCoin.deployed().then(function(coin) {
      return coin.balanceOf.call(buyer).then(function(balance) {
        console.log("Buyer balance: ", balance.valueOf(), " ALLC");
        return coin.burn(balance.valueOf()).then(function() {
          assert(false, "Throw was supposed to throw but didn't.");
        });
      });
    }).catch(function(error) {
      console.log("Throw was happened. Test succeeded.");
    });
  });

  it("Set end of crowdsale period", function() {
    web3.evm.increaseTime(PERIOD_28_DAYS);
  });


  it("Try to buy 10,000 more coins {from: buyer}", function() {
    return Crowdsale.deployed().then(function(crowd) {
       return crowd.sendTransaction({from: buyer, to: crowd.address, value: web3.toWei(1, "ether")}).then(function(txn) {
          assert(false, "Throw was supposed to throw but didn't.");
       })
     }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
     });
  });

  it("Finalize crowdsale", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.finalize({from: owner}).then(function() {
        console.log("Finalize");
      });
    });
  });

  it("Try to invoke backAllCodeCoinOwner {from: buyer}", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.backAllCodeCoinOwner({from: buyer}).then(function() {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      });
    });
  });

  it("Invoke backAllCodeCoinOwner {from: Crowdsale contract}", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.backAllCodeCoinOwner().then(function() {
        return AllCodeCoin.deployed().then(function(coin) {
          return coin.owner.call().then(function(coinOwner) {
            console.log("AllCodeCoin owner was changed to: " + coinOwner);
            assert.equal(coinOwner, owner, "AllCodeCoin owner addresws must be equals to Crowdsale owner address");
          })              
        })
      }).catch(function(error) {
        assert(false, "Throw was happened, but wasn't expected.");
      });
    });
  });


  it("Invoke backAllCodeCoinOwner one more time {from: Crowdsale contract}", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.backAllCodeCoinOwner().then(function() {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      });
    });
  });



  it("Get wallet balance", function() {
     printBalance();
  });


  function rpc(method, arg) {
    var req = {
      jsonrpc: "2.0",
      method: method,
      id: new Date().getTime()
    };

    if (arg) req.params = arg;

    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync(req, (err, result) => {
        if (err) return reject(err)
        if (result && result.error) {
          return reject(new Error("RPC Error: " + (result.error.message || result.error)))
        }
        resolve(result)
      });
    })
  }

  // Change block time using the rpc call "evm_increaseTime"
  web3.evm = web3.evm || {}
  web3.evm.increaseTime = function (time) {
    return rpc('evm_increaseTime', [time]);
  }

});
