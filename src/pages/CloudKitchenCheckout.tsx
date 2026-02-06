import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Clock, Loader2, ChefHat, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CartItemData {
  item: {
    id: string;
    name: string;
    price: number;
    set_size: number;
    min_order_sets: number;
  };
  quantity: number;
}

interface LocationState {
  cartItems: CartItemData[];
  division: {
    id: string;
    name: string;
    slot_type: string;
    start_time: string;
    end_time: string;
  };
  totalAmount: number;
}

const CloudKitchenCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { selectedPanchayat, selectedWardNumber, isLocationSet } = useLocationContext();

  const state = location.state as LocationState | null;

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if no cart data
  if (!state || !state.cartItems || state.cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b bg-card px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cloud-kitchen')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg font-semibold">Checkout</h1>
        </header>

        <div className="flex flex-col items-center justify-center py-20 px-4">
          <ChefHat className="h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No items to checkout</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Add some items from the menu to proceed
          </p>
          <Button className="mt-6" onClick={() => navigate('/cloud-kitchen')}>
            Browse Menu
          </Button>
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b bg-card px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg font-semibold">Checkout</h1>
        </header>

        <div className="flex flex-col items-center justify-center py-20 px-4">
          <AlertCircle className="h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Login Required</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Please login to place your order
          </p>
          <Button className="mt-6" onClick={() => navigate('/customer-auth')}>
            Login
          </Button>
        </div>
      </div>
    );
  }

  // Check location
  if (!isLocationSet) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b bg-card px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg font-semibold">Checkout</h1>
        </header>

        <div className="flex flex-col items-center justify-center py-20 px-4">
          <MapPin className="h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Location Required</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Please update your profile with your Panchayat and Ward
          </p>
          <Button className="mt-6" onClick={() => navigate('/profile')}>
            Update Profile
          </Button>
        </div>
      </div>
    );
  }

  const { cartItems, division, totalAmount } = state;
  const deliveryFee = 0; // Free delivery
  const grandTotal = totalAmount + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      toast({
        title: 'Address Required',
        description: 'Please enter your delivery address',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate order number
      const orderNumber = `CK${Date.now()}`;

      // Find available cooks for cloud kitchen in this panchayat
      const { data: availableCooks } = await supabase
        .from('cooks')
        .select('id')
        .eq('is_active', true)
        .eq('is_available', true)
        .eq('panchayat_id', selectedPanchayat!.id)
        .contains('allowed_order_types', ['cloud_kitchen'])
        .limit(1);

      const assignedCookId = availableCooks?.[0]?.id || null;

      // Create the order with cloud_kitchen_slot_id and proper status
      // Note: Cook assignment is managed via order_assigned_cooks table, not orders.assigned_cook_id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          customer_id: user.id,
          service_type: 'cloud_kitchen' as const,
          total_amount: grandTotal,
          panchayat_id: selectedPanchayat!.id,
          ward_number: selectedWardNumber!,
          delivery_address: deliveryAddress,
          delivery_instructions: deliveryInstructions || null,
          cloud_kitchen_slot_id: division.id,
          status: 'confirmed', // Auto-confirm cloud kitchen orders
          cook_status: 'pending', // Waiting for cook to prepare
          delivery_status: 'pending', // Waiting for delivery assignment
          cook_assignment_status: assignedCookId ? 'pending' : 'unassigned',
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(cartItem => ({
        order_id: order.id,
        food_item_id: cartItem.item.id,
        quantity: cartItem.quantity * (cartItem.item.set_size || 1), // Total individual items
        unit_price: cartItem.item.price,
        total_price: cartItem.item.price * cartItem.quantity * (cartItem.item.set_size || 1),
        assigned_cook_id: assignedCookId,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create cook assignment in order_assigned_cooks table (this is what cooks see)
      if (assignedCookId) {
        const { error: assignError } = await supabase
          .from('order_assigned_cooks')
          .insert([{
            order_id: order.id,
            cook_id: assignedCookId,
            cook_status: 'pending',
            assigned_at: new Date().toISOString(),
          }]);

        if (assignError) {
          console.error('Failed to create cook assignment:', assignError);
        }
      }

      toast({
        title: 'Order Placed!',
        description: `Your order #${order.order_number} has been placed for ${division.name}`,
      });

      navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'Error',
        description: 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b bg-card px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-lg font-semibold">Checkout</h1>
      </header>

      <main className="p-4 space-y-4">
        {/* Meal Slot Info */}
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">{division.name}</span> delivery slot: {formatTime(division.start_time)} - {formatTime(division.end_time)}
          </AlertDescription>
        </Alert>

        {/* Delivery Location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Delivery Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location from profile */}
            <div className="rounded-lg bg-muted p-3 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium">Ward {selectedWardNumber}, {selectedPanchayat?.name}</p>
                <p className="text-xs text-muted-foreground">From your registered profile</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address *</Label>
              <Textarea
                id="address"
                placeholder="House name, street, landmark..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
              <Input
                id="instructions"
                placeholder="Any special instructions..."
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cartItems.map((cartItem) => {
              const setSize = cartItem.item.set_size || 1;
              const itemTotal = cartItem.item.price * cartItem.quantity * setSize;
              return (
                <div key={cartItem.item.id} className="flex justify-between text-sm">
                  <span>
                    {cartItem.item.name} × {cartItem.quantity} {cartItem.quantity > 1 ? 'sets' : 'set'}
                    {setSize > 1 && <span className="text-muted-foreground"> ({setSize * cartItem.quantity} pcs)</span>}
                  </span>
                  <span>₹{itemTotal.toFixed(0)}</span>
                </div>
              );
            })}
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{totalAmount.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="text-green-600">FREE</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-lg">₹{grandTotal.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-card p-4 shadow-lg">
        <Button
          className="w-full h-12 text-base"
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Placing Order...
            </>
          ) : (
            `Place Order • ₹${grandTotal.toFixed(0)}`
          )}
        </Button>
      </div>
    </div>
  );
};

export default CloudKitchenCheckout;
