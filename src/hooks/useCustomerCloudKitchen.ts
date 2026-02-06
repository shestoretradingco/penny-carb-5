import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerCloudKitchenItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_vegetarian: boolean;
  set_size: number;
  min_order_sets: number;
  cloud_kitchen_slot_id: string | null;
  images: {
    id: string;
    image_url: string;
    is_primary: boolean;
  }[];
}

export interface ActiveDivision {
  id: string;
  name: string;
  slot_type: string;
  start_time: string;
  end_time: string;
  cutoff_hours_before: number;
  is_ordering_open: boolean;
  time_until_cutoff: { hours: number; minutes: number } | null;
  status_label: 'open' | 'closing_soon' | 'closed';
}

function checkIfOrderingOpen(slot: {
  start_time: string;
  end_time: string;
  cutoff_hours_before: number;
}): {
  isOpen: boolean;
  timeRemaining: { hours: number; minutes: number } | null;
  statusLabel: 'open' | 'closing_soon' | 'closed';
} {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Parse slot times
  const [startHours, startMins] = slot.start_time.split(':').map(Number);
  const slotStartMinutes = startHours * 60 + startMins;

  const [endHours, endMins] = slot.end_time.split(':').map(Number);
  const slotEndMinutes = endHours * 60 + endMins;

  // Is current time within the slot window? (supports overnight slots)
  const isWithinSlotTime =
    slotEndMinutes > slotStartMinutes
      ? currentMinutes >= slotStartMinutes && currentMinutes < slotEndMinutes
      : currentMinutes >= slotStartMinutes || currentMinutes < slotEndMinutes;

  // If we are currently in the slot window, ordering should be OPEN until end_time
  if (isWithinSlotTime) {
    let remainingMinutes = slotEndMinutes - currentMinutes;
    if (remainingMinutes < 0) {
      // Overnight slot: end time is next day
      remainingMinutes = 24 * 60 + remainingMinutes;
    }

    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;

    const statusLabel: 'open' | 'closing_soon' | 'closed' =
      remainingMinutes <= 60 ? 'closing_soon' : 'open';

    return {
      isOpen: true,
      timeRemaining: { hours, minutes },
      statusLabel,
    };
  }

  // If we are past the slot end, it is closed for today
  const hasSlotEndedToday =
    slotEndMinutes > slotStartMinutes
      ? currentMinutes >= slotEndMinutes
      : currentMinutes >= slotEndMinutes && currentMinutes < slotStartMinutes;

  if (hasSlotEndedToday) {
    return { isOpen: false, timeRemaining: null, statusLabel: 'closed' };
  }

  // Otherwise, we are BEFORE the slot start. Ordering is open only until cutoff.
  // Cutoff is (start_time - cutoff_hours_before)
  let cutoffMinutes = slotStartMinutes - slot.cutoff_hours_before * 60;

  // If cutoff wraps to previous day, normalize to 0..1439, but remember it wrapped.
  const cutoffWrapped = cutoffMinutes < 0;
  if (cutoffWrapped) cutoffMinutes = 24 * 60 + cutoffMinutes;

  // If cutoff wrapped, cutoff happened "yesterday" at cutoffMinutes, so on the day of the slot
  // ordering is already closed (since we're after yesterday's cutoff).
  const isBeforeCutoff = cutoffWrapped ? false : currentMinutes < cutoffMinutes;

  if (!isBeforeCutoff) {
    return { isOpen: false, timeRemaining: null, statusLabel: 'closed' };
  }

  // Time remaining until cutoff
  const remainingMinutes = cutoffMinutes - currentMinutes;
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  const statusLabel: 'open' | 'closing_soon' | 'closed' =
    remainingMinutes <= 60 ? 'closing_soon' : 'open';

  return {
    isOpen: true,
    timeRemaining: { hours, minutes },
    statusLabel,
  };
}

export function useCustomerDivisions() {
  return useQuery({
    queryKey: ['customer-cloud-kitchen-divisions'],
    queryFn: async () => {
      const { data: slots, error } = await supabase
        .from('cloud_kitchen_slots')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      return (slots || []).map((slot) => {
        const { isOpen, timeRemaining, statusLabel } = checkIfOrderingOpen(slot);
        return {
          id: slot.id,
          name: slot.name,
          slot_type: slot.slot_type,
          start_time: slot.start_time,
          end_time: slot.end_time,
          cutoff_hours_before: slot.cutoff_hours_before,
          is_ordering_open: isOpen,
          time_until_cutoff: timeRemaining,
          status_label: statusLabel,
        } as ActiveDivision;
      });
    },
    refetchInterval: 60000, // Refresh every minute to update time remaining
  });
}

export function useCustomerDivisionItems(divisionId: string | null) {
  return useQuery({
    queryKey: ['customer-division-items', divisionId],
    queryFn: async () => {
      if (!divisionId) return [];

      const { data, error } = await supabase
        .from('food_items')
        .select(`
          id,
          name,
          description,
          price,
          is_vegetarian,
          set_size,
          min_order_sets,
          cloud_kitchen_slot_id,
          images:food_item_images(id, image_url, is_primary)
        `)
        .eq('cloud_kitchen_slot_id', divisionId)
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      return (data || []) as CustomerCloudKitchenItem[];
    },
    enabled: !!divisionId,
  });
}
