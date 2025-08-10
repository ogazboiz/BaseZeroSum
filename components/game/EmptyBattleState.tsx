"use client"

import { Button } from "@/components/ui/button"
import { Search, Crown } from "lucide-react"

interface EmptyBattleStateProps {
  onCreateBattle: () => void
}

export default function EmptyBattleState({ onCreateBattle }: EmptyBattleStateProps) {
  return (
    <div className="text-center py-20">
      <div className="w-32 h-32 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mx-auto mb-8">
        <Search className="w-16 h-16 text-slate-400" />
      </div>
      <h3 className="text-3xl font-black text-white mb-4">NO BATTLES FOUND</h3>
      <p className="text-slate-400 mb-8 font-medium">Try adjusting your search or filters</p>
      <Button
        onClick={onCreateBattle}
        className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-black text-lg px-8 py-4 rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-105"
      >
        <Crown className="w-6 h-6 mr-2" />
        CREATE NEW BATTLE
      </Button>
    </div>
  )
}
