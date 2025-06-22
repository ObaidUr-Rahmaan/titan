'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useOrganizationSubscription } from '@/utils/hooks/useOrganizationSubscription'
import { Users, Plus, Minus, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface SeatManagementProps {
  compact?: boolean
}

export function OrganizationSeatManagement({ compact = false }: SeatManagementProps) {
  const {
    subscription,
    totalSeats,
    usedSeats,
    availableSeats,
    isActive,
    updateSubscription,
    isUpdating,
    canAddSeats
  } = useOrganizationSubscription()

  const [seatCount, setSeatCount] = useState(1)
  const [autoAddSeats, setAutoAddSeats] = useState(subscription?.autoAddSeats || false)

  const handleAddSeats = async () => {
    if (!isActive || seatCount < 1) return

    try {
      await updateSubscription({
        action: 'add_seats',
        seatCount: seatCount,
      })
      toast.success(`Added ${seatCount} seat${seatCount > 1 ? 's' : ''} to your plan`)
      setSeatCount(1)
    } catch (error) {
      toast.error('Failed to add seats. Please try again.')
    }
  }

  const handleRemoveSeats = async () => {
    if (!isActive || seatCount < 1 || seatCount > availableSeats) return

    try {
      await updateSubscription({
        action: 'remove_seats',
        seatCount: seatCount,
      })
      toast.success(`Removed ${seatCount} seat${seatCount > 1 ? 's' : ''} from your plan`)
      setSeatCount(1)
    } catch (error) {
      toast.error('Failed to remove seats. Please try again.')
    }
  }

  const handleAutoAddToggle = async (enabled: boolean) => {
    try {
      await updateSubscription({
        action: 'update_billing',
        autoAddSeats: enabled,
      })
      setAutoAddSeats(enabled)
      toast.success(`Auto-add seats ${enabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      toast.error('Failed to update auto-add setting. Please try again.')
    }
  }

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span className="font-medium">Seats</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {usedSeats}/{totalSeats}
          </span>
        </div>
        
        {canAddSeats() && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="100"
              value={seatCount}
              onChange={(e) => setSeatCount(parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <Button
              size="sm"
              onClick={handleAddSeats}
              disabled={isUpdating || !isActive}
            >
              <Plus size={14} />
            </Button>
            {availableSeats > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemoveSeats}
                disabled={isUpdating || seatCount > availableSeats}
              >
                <Minus size={14} />
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users size={20} />
          Seat Management
        </CardTitle>
        <CardDescription>
          Add or remove seats for your organization
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Usage */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{totalSeats}</p>
            <p className="text-sm text-muted-foreground">Total Seats</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{usedSeats}</p>
            <p className="text-sm text-muted-foreground">Used Seats</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">{availableSeats}</p>
            <p className="text-sm text-muted-foreground">Available</p>
          </div>
        </div>

        {/* Seat Management Controls */}
        {canAddSeats() && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="seat-count">Number of seats</Label>
                <Input
                  id="seat-count"
                  type="number"
                  min="1"
                  max="100"
                  value={seatCount}
                  onChange={(e) => setSeatCount(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddSeats}
                  disabled={isUpdating || !isActive}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Seats
                </Button>
                {availableSeats > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleRemoveSeats}
                    disabled={isUpdating || seatCount > availableSeats}
                    className="flex items-center gap-2"
                  >
                    <Minus size={16} />
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Auto-add seats toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="auto-add-seats" className="font-medium">
                  Auto-add seats
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically add seats when members are invited
                </p>
              </div>
              <Switch
                id="auto-add-seats"
                checked={autoAddSeats}
                onCheckedChange={handleAutoAddToggle}
                disabled={isUpdating}
              />
            </div>

            {/* Pricing info */}
            {subscription?.seatPrice && (
              <div className="text-sm text-muted-foreground text-center">
                Additional seats: ${(subscription.seatPrice / 100).toFixed(2)}/seat/month
              </div>
            )}
          </div>
        )}

        {!canAddSeats() && (
          <div className="text-center text-muted-foreground">
            <Settings size={24} className="mx-auto mb-2" />
            <p>Contact support to modify seat allocation</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 