import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

const CartButton: React.FC = () => {
  const navigate = useNavigate();
  const { itemCount, totalAmount } = useCart();

  if (itemCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:left-auto sm:right-4 sm:w-auto sm:max-w-md">
      <Button
        className="w-full justify-between gap-4 rounded-xl py-6 text-base shadow-lg"
        onClick={() => navigate('/cart')}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-bold">
            {itemCount}
          </div>
          <ShoppingCart className="h-5 w-5" />
          <span>View Cart</span>
        </div>
        <span className="font-semibold">₹{totalAmount.toFixed(0)}</span>
      </Button>
    </div>
  );
};

export default CartButton;
