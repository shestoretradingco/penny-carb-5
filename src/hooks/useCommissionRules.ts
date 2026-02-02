import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CommissionRule {
  id: string;
  name: string;
  description: string | null;
  commission_percent: number;
  min_order_amount: number | null;
  max_commission_amount: number | null;
  service_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommissionRuleInput {
  name: string;
  description?: string;
  commission_percent: number;
  min_order_amount?: number;
  max_commission_amount?: number;
  service_type: string;
  is_active?: boolean;
}

export const useCommissionRules = (serviceType?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rules, isLoading, error } = useQuery({
    queryKey: ['commission-rules', serviceType],
    queryFn: async () => {
      let query = supabase
        .from('commission_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CommissionRule[];
    },
  });

  const createRule = useMutation({
    mutationFn: async (rule: CommissionRuleInput) => {
      const { data, error } = await supabase
        .from('commission_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      toast({
        title: 'Rule Created',
        description: 'Commission rule has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CommissionRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('commission_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      toast({
        title: 'Rule Updated',
        description: 'Commission rule has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commission_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      toast({
        title: 'Rule Deleted',
        description: 'Commission rule has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    rules,
    isLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
  };
};
