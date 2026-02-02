import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Wallet, Loader2 } from 'lucide-react';

interface ReferralPayoutButtonProps {
  referralId: string;
  referrerId: string;
  amount: number;
  status: string;
  onSuccess?: () => void;
}

const ReferralPayoutButton: React.FC<ReferralPayoutButtonProps> = ({
  referralId,
  referrerId,
  amount,
  status,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);

  const payoutMutation = useMutation({
    mutationFn: async () => {
      // 1. Check if wallet exists, if not create it
      const { data: existingWallet, error: walletCheckError } = await supabase
        .from('customer_wallets')
        .select('id, balance')
        .eq('user_id', referrerId)
        .maybeSingle();

      if (walletCheckError) throw walletCheckError;

      let walletId: string;
      let currentBalance: number;

      if (!existingWallet) {
        // Create new wallet
        const { data: newWallet, error: createError } = await supabase
          .from('customer_wallets')
          .insert({ user_id: referrerId, balance: 0 })
          .select('id, balance')
          .single();

        if (createError) throw createError;
        walletId = newWallet.id;
        currentBalance = 0;
      } else {
        walletId = existingWallet.id;
        currentBalance = existingWallet.balance;
      }

      const newBalance = currentBalance + amount;

      // 2. Update wallet balance
      const { error: updateError } = await supabase
        .from('customer_wallets')
        .update({
          balance: newBalance,
          total_credited: supabase.rpc ? newBalance : newBalance, // Will be updated properly
        })
        .eq('id', walletId);

      if (updateError) throw updateError;

      // 3. Create wallet transaction record
      const { error: transactionError } = await supabase
        .from('customer_wallet_transactions')
        .insert({
          wallet_id: walletId,
          amount: amount,
          balance_after: newBalance,
          transaction_type: 'credit',
          reference_type: 'referral_commission',
          reference_id: referralId,
          description: `Referral commission payout`,
          status: 'completed',
        });

      if (transactionError) throw transactionError;

      // 4. Update referral status to paid
      const { error: referralError } = await supabase
        .from('referrals')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', referralId);

      if (referralError) throw referralError;

      return { walletId, newBalance };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indoor-events-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['customer-wallets'] });
      toast({
        title: 'Payout Successful',
        description: `₹${amount.toLocaleString()} has been credited to the referrer's wallet.`,
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Payout Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const isPayable = status === 'approved' || status === 'pending';

  if (status === 'paid') {
    return (
      <Button variant="outline" size="sm" disabled className="text-green-600">
        <Wallet className="h-4 w-4 mr-1" />
        Paid
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        disabled={!isPayable || payoutMutation.isPending}
        onClick={() => setShowConfirm(true)}
        className="bg-green-600 hover:bg-green-700"
      >
        {payoutMutation.isPending ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4 mr-1" />
        )}
        Pay ₹{amount.toLocaleString()}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Commission Payout</AlertDialogTitle>
            <AlertDialogDescription>
              This will credit <strong>₹{amount.toLocaleString()}</strong> to the referrer's wallet.
              {status === 'pending' && (
                <span className="block mt-2 text-yellow-600">
                  Note: This referral is still pending approval. Proceeding will also mark it as paid.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => payoutMutation.mutate()}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Payout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReferralPayoutButton;
