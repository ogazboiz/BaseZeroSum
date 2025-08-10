"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface BattleSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export default function BattleSearch({ searchTerm, onSearchChange }: BattleSearchProps) {
  return (
    <div className="flex-1 relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
      <Input
        placeholder="Search battles by mode or warrior..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-12 bg-slate-800/60 backdrop-blur-sm border-slate-600/50 text-white rounded-xl h-14 text-lg font-medium placeholder:text-slate-400 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all duration-300"
      />
    </div>
  )
}
