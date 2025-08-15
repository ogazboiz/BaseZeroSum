"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Settings, Coins, Clock, Shield, Eye } from "lucide-react"

interface GameSettingsProps {
  entryFee: number[]
  onEntryFeeChange: (value: number[]) => void
  gameSettings: {
    isPrivate: boolean
    allowSpectators: boolean
    timeout: number
  }
  onGameSettingsChange: (settings: any) => void
}

export default function GameSettings({ entryFee, onEntryFeeChange, gameSettings, onGameSettingsChange }: GameSettingsProps) {
  const handleSettingChange = (key: string, value: any) => {
    onGameSettingsChange({ ...gameSettings, [key]: value })
  }

  return (
    <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-black text-white flex items-center">
          <Settings className="w-8 h-8 mr-3 text-blue-400" />
          BATTLE CONFIGURATION
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Entry Fee */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Coins className="w-6 h-6 text-amber-400" />
            <Label className="text-xl font-bold text-white">ENTRY FEE</Label>
          </div>
          <div className="space-y-4">
            <Slider
              value={entryFee}
              onValueChange={onEntryFeeChange}
              max={2}
              min={0.01}
              step={0.01}
              className="w-full"
            />
            <div className="text-center">
                  <span className="text-3xl font-black text-amber-400">{entryFee[0]} MNT</span>
            </div>
          </div>
        </div>

        {/* Timeout - Fixed at 3 minutes */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-red-400" />
            <Label className="text-xl font-bold text-white">TIMEOUT (FIXED)</Label>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-center">
            <span className="text-2xl font-black text-red-400">{gameSettings.timeout}s</span>
            <p className="text-sm text-slate-400 mt-1">90 seconds</p>
          </div>
        </div>

        {/* Toggle Options */}
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl opacity-50 cursor-not-allowed">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-slate-400" />
              <div>
                <Label className="text-lg font-bold text-slate-400">PRIVATE BATTLE</Label>
                <p className="text-sm text-slate-500">Coming soon - Only invited players can join</p>
              </div>
            </div>
            <Switch
              checked={false}
              disabled={true}
              className="opacity-50"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center space-x-3">
              <Eye className="w-6 h-6 text-blue-400" />
              <div>
                <Label className="text-lg font-bold text-white">ALLOW SPECTATORS</Label>
                <p className="text-sm text-slate-400">Others can watch the battle</p>
              </div>
            </div>
            <Switch
              checked={gameSettings.allowSpectators}
              onCheckedChange={(checked) => handleSettingChange("allowSpectators", checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
