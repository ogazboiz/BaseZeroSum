"use client"

import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"

export interface BattleFilter {
  id: string
  label: string
  count: number
}

interface BattleFiltersProps {
  filters: BattleFilter[]
  selectedFilter: string
  onFilterSelect: (filterId: string) => void
}

export default function BattleFilters({ filters, selectedFilter, onFilterSelect }: BattleFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={selectedFilter === filter.id ? "default" : "outline"}
          onClick={() => onFilterSelect(filter.id)}
          className={`rounded-xl font-bold px-6 transition-all duration-300 ${
            selectedFilter === filter.id
              ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
              : "border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-500"
          }`}
        >
          <Filter className="w-4 h-4 mr-2" />
          {filter.label} ({filter.count})
        </Button>
      ))}
    </div>
  )
}
