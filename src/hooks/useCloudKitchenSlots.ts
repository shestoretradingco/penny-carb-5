import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CloudKitchenSlot } from '@/types/events';

export function useCloudKitchenSlots() {
  return useQuery({
    queryKey: ['cloud-kitchen-slots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cloud_kitchen_slots')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as CloudKitchenSlot[];
    },
  });
}

// Helper function to check if a slot is available for ordering
export function isSlotAvailable(slot: CloudKitchenSlot): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = slot.start_time.split(':').map(Number);
  const slotStartMinutes = startH * 60 + startM;

  const [endH, endM] = slot.end_time.split(':').map(Number);
  const slotEndMinutes = endH * 60 + endM;

  const isWithinSlotTime =
    slotEndMinutes > slotStartMinutes
      ? currentMinutes >= slotStartMinutes && currentMinutes < slotEndMinutes
      : currentMinutes >= slotStartMinutes || currentMinutes < slotEndMinutes;

  if (isWithinSlotTime) return true;

  // Before slot start: allow ordering until cutoff
  let cutoffMinutes = slotStartMinutes - slot.cutoff_hours_before * 60;
  const cutoffWrapped = cutoffMinutes < 0;
  if (cutoffWrapped) cutoffMinutes = 24 * 60 + cutoffMinutes;

  // If cutoff wrapped, cutoff was "yesterday" relative to today's slot start → closed today.
  if (cutoffWrapped) return false;

  return currentMinutes < cutoffMinutes;
}

// Get time remaining (if within slot: until end; if before slot start: until cutoff)
export function getTimeUntilCutoff(
  slot: CloudKitchenSlot
): { hours: number; minutes: number } | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = slot.start_time.split(':').map(Number);
  const slotStartMinutes = startH * 60 + startM;

  const [endH, endM] = slot.end_time.split(':').map(Number);
  const slotEndMinutes = endH * 60 + endM;

  const isWithinSlotTime =
    slotEndMinutes > slotStartMinutes
      ? currentMinutes >= slotStartMinutes && currentMinutes < slotEndMinutes
      : currentMinutes >= slotStartMinutes || currentMinutes < slotEndMinutes;

  if (isWithinSlotTime) {
    let remainingMinutes = slotEndMinutes - currentMinutes;
    if (remainingMinutes < 0) remainingMinutes = 24 * 60 + remainingMinutes;
    return {
      hours: Math.floor(remainingMinutes / 60),
      minutes: remainingMinutes % 60,
    };
  }

  // Before slot start: remaining time to cutoff
  let cutoffMinutes = slotStartMinutes - slot.cutoff_hours_before * 60;
  const cutoffWrapped = cutoffMinutes < 0;
  if (cutoffWrapped) cutoffMinutes = 24 * 60 + cutoffMinutes;

  if (cutoffWrapped) return null;
  if (currentMinutes >= cutoffMinutes) return null;

  const remainingMinutes = cutoffMinutes - currentMinutes;
  return {
    hours: Math.floor(remainingMinutes / 60),
    minutes: remainingMinutes % 60,
  };
}

// Format time for display
export function formatSlotTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
