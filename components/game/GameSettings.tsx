"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

interface GameSettingsProps {
  entryFee: number[]
  onEntryFeeChange: (value: number[]) => void
  gameSettings: {
    isPrivate: boolean
    allowSpectators: boolean
    timeout: number
  }
  onGameSettingsChange: (settings: any) => void
  selectedMode: string
  maxEntryFee: number
}

export default function GameSettings({ 
  entryFee, 
  onEntryFeeChange, 
  gameSettings, 
  onGameSettingsChange,
  selectedMode,
  maxEntryFee
}: GameSettingsProps) {
  
  // Calculate min entry fee and step size based on selected mode
  const getMinEntryFee = () => {
    switch (selectedMode) {
      case "quick-draw":
        return 0.0001 // New lower minimum for Quick Draw
      case "strategic":
        return 0.001 // Higher minimum for Strategic
      default:
        return 0.001
    }
  }

  const getStepSize = () => {
    switch (selectedMode) {
      case "quick-draw":
        return 0.0001 // Smaller steps for Quick Draw (0.0001 ETH)
      case "strategic":
        return 0.001 // Larger steps for Strategic (0.001 ETH)
      default:
        return 0.001
    }
  }

  const minEntryFee = getMinEntryFee()
  const stepSize = getStepSize()

  return (
    <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-black text-white flex items-center">
          <Settings className="w-6 h-6 mr-3 text-violet-400" />
          BATTLE CONFIGURATION
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Entry Fee */}
        <div>
          <Label className="text-lg font-bold text-white mb-4 block">ENTRY FEE (ETH)</Label>
          <div className="space-y-4">
            <Slider
              value={entryFee}
              onValueChange={onEntryFeeChange}
              max={maxEntryFee}
              min={minEntryFee}
              step={stepSize}
              className="w-full"
            />
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{minEntryFee} ETH</span>
              <span className="text-2xl font-black text-cyan-400">{entryFee[0]} ETH</span>
              <span className="text-slate-400">{maxEntryFee} ETH</span>
            </div>
          </div>
        </div>

        {/* Timeout Setting */}
        <div>
          <Label className="text-lg font-bold text-white mb-4 block">TURN TIMEOUT (SECONDS)</Label>
          <Input
            type="number"
            value={gameSettings.timeout}
            onChange={(e) => onGameSettingsChange({ ...gameSettings, timeout: Number.parseInt(e.target.value) })}
            className="bg-slate-800/50 border-slate-600/50 text-white rounded-xl text-lg font-bold"
            min={60}
            max={600}
          />
        </div>

        {/* Toggle Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
            <div>
              <span className="font-bold text-white">ALLOW SPECTATORS</span>
              <div className="text-sm text-slate-400">Let others watch and bet on your battle</div>
            </div>
            <Button
              variant={gameSettings.allowSpectators ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onGameSettingsChange({ ...gameSettings, allowSpectators: !gameSettings.allowSpectators })
              }
              className={`rounded-lg font-bold ${
                gameSettings.allowSpectators
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "border-slate-600 text-white hover:bg-slate-800/50"
              }`}
            >
              {gameSettings.allowSpectators ? "YES" : "NO"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
            <div>
              <span className="font-bold text-white">PRIVATE BATTLE</span>
              <div className="text-sm text-slate-400">Only invited players can join</div>
            </div>
            <Button
              variant={gameSettings.isPrivate ? "default" : "outline"}
              size="sm"
              onClick={() => onGameSettingsChange({ ...gameSettings, isPrivate: !gameSettings.isPrivate })}
              className={`rounded-lg font-bold ${
                gameSettings.isPrivate
                  ? "bg-violet-600 hover:bg-violet-700"
                  : "border-slate-600 text-white hover:bg-slate-800/50"
              }`}
            >
              {gameSettings.isPrivate ? "YES" : "NO"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
