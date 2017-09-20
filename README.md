# AllCodeCoin-token

Cryptocurrency based on Ethereum for healthcare rewards
## Requirements

To run tests you need to install the following software:

- [Truffle v3.2.4](https://github.com/trufflesuite/truffle-core)
- [Open-Zeppelin]

## How to test

To run test open the terminal and run the following commands:
```sh
$ cd smart-contract
$ truffle migrate
$ truffle test ./test/MainFlow.js

## Deployment

To deploy smart contracts to live network do the following steps:
1. Go to the smart contract folder and run truffle console:
```sh
$ cd smart-contract
$ truffle console
```
2. Inside truffle console invoke "migrate" command to deploy contracts:
```sh
truffle> migrate
