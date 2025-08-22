// config/abis/ZeroSumSpectatorABI.ts

export const ZeroSumSpectatorABI = [
  // Events
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
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "predictedWinner",
        "type": "address"
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
  // Structs
  {
    "inputs": [
      {
        "components": [
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
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct ZeroSumSpectator.Bet",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "name": "gameBets",
    "outputs": [],
    "stateMutability": "view",
    "type": "function"
  },
  // Core functions
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
    "name": "withdrawSpectatorBalance",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // View functions
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
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "hasUserBetOnGame",
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
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getUserBetInfo",
    "outputs": [
      {
        "internalType": "bool",
        "name": "hasBet",
        "type": "bool"
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
        "internalType": "uint256",
        "name": "timestamp",
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
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getUserBettingHistory",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_limit",
        "type": "uint256"
      }
    ],
    "name": "getUserBettingHistoryDetailed",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "gameKeys",
        "type": "bytes32[]"
      },
      {
        "internalType": "address[]",
        "name": "gameContracts",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "gameIds",
        "type": "uint256[]"
      },
      {
        "internalType": "address[]",
        "name": "predictedWinners",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      },
      {
        "internalType": "bool[]",
        "name": "claimed",
        "type": "bool[]"
      },
      {
        "internalType": "uint256[]",
        "name": "timestamps",
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
    "name": "getGameBettingStats",
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
        "internalType": "uint256",
        "name": "numberOfUniqueBettors",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "bettingAllowed",
        "type": "bool"
      },
      {
        "internalType": "address[]",
        "name": "players",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "playerBetAmounts",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "playerBetCounts",
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
  // Admin functions
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
        "internalType": "uint256",
        "name": "_gameId",
        "type": "uint256"
      }
    ],
    "name": "finalizeGameBetting",
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
  CANCELLED = 3,
}
