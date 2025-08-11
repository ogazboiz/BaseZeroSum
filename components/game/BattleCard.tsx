import React from 'react'

export type Battle = {
  id: string
  title: string
  status: 'pending' | 'active' | 'finished' | 'cancelled'
  players: string[]
  createdAt: Date
  updatedAt: Date
}

interface BattleCardProps {
  battle: Battle
  onClick?: () => void
}

export function BattleCard({ battle, onClick }: BattleCardProps) {
  return (
    <div 
      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <h3 className="font-semibold">{battle.title}</h3>
      <p className="text-sm text-gray-600">Status: {battle.status}</p>
      <p className="text-sm text-gray-600">Players: {battle.players.length}</p>
    </div>
  )
}
