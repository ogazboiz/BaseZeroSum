// config/abis/ZeroSumSpectatorABI.ts

export const ZeroSumSpectatorABI =[
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ReentrancyGuardReentrantCall",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "gameContract",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "bettor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "BetPlaced",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "gameContract",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "bettor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "winnings",
				"type": "uint256"
			}
		],
		"name": "BetsClaimed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "gameContract",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			}
		],
		"name": "BettingClosed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "bettingClosed",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "bettingFeePercent",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_gameContract",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_gameId",
				"type": "uint256"
			}
		],
		"name": "claimBettingWinnings",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "emergencyWithdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "enableLastStandBetting",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_gameId",
				"type": "uint256"
			}
		],
		"name": "finalizeGameBetting",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "gameBets",
		"outputs": [
			{
				"internalType": "address",
				"name": "bettor",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "predictedWinner",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "claimed",
				"type": "bool"
			},
			{
				"internalType": "address",
				"name": "gameContract",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_gameContract",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_gameId",
				"type": "uint256"
			},
			{
				"internalType": "address[]",
				"name": "_players",
				"type": "address[]"
			}
		],
		"name": "getBettingOdds",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "betAmounts",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "oddPercentages",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_gameContract",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_gameId",
				"type": "uint256"
			}
		],
		"name": "getGameBettingInfo",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalBetAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "numberOfBets",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "bettingAllowed",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "globalBettingEnabled",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_gameContract",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_gameId",
				"type": "uint256"
			}
		],
		"name": "isBettingAllowed",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "minimumBet",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_gameContract",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_gameId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_predictedWinner",
				"type": "address"
			}
		],
		"name": "placeBet",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_gameContract",
				"type": "address"
			}
		],
		"name": "registerGameContract",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "registeredContracts",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_feePercent",
				"type": "uint256"
			}
		],
		"name": "setBettingFee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bool",
				"name": "_enabled",
				"type": "bool"
			}
		],
		"name": "setGlobalBettingEnabled",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_minimumBet",
				"type": "uint256"
			}
		],
		"name": "setMinimumBet",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "spectatorBalances",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "totalBetsOnPlayer",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "totalGameBets",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "updateLastStandRound",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawSpectatorBalance",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
] as const;

export type ZeroSumSpectatorContract = typeof ZeroSumSpectatorABI;

// GameStatus enum
export enum GameStatus {
  PENDING = 0,
  ACTIVE = 1,
  FINISHED = 2,
  CANCELLED = 3
}
