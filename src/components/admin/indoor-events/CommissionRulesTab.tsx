import React, { useState } from 'react';
import { useCommissionRules, CommissionRuleInput } from '@/hooks/useCommissionRules';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Plus, Pencil, Trash2, Percent, Settings } from 'lucide-react';

const CommissionRulesTab: React.FC = () => {
  const { rules, isLoading, createRule, updateRule, deleteRule } = useCommissionRules('indoor_events');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CommissionRuleInput>({
    name: '',
    description: '',
    commission_percent: 5,
    min_order_amount: 0,
    max_commission_amount: undefined,
    service_type: 'indoor_events',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      commission_percent: 5,
      min_order_amount: 0,
      max_commission_amount: undefined,
      service_type: 'indoor_events',
      is_active: true,
    });
    setEditingRule(null);
  };

  const handleOpenDialog = (rule?: any) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        description: rule.description || '',
        commission_percent: rule.commission_percent,
        min_order_amount: rule.min_order_amount || 0,
        max_commission_amount: rule.max_commission_amount || undefined,
        service_type: rule.service_type,
        is_active: rule.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRule) {
      await updateRule.mutateAsync({ id: editingRule.id, ...formData });
    } else {
      await createRule.mutateAsync(formData);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteRule.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (rule: any) => {
    await updateRule.mutateAsync({ id: rule.id, is_active: !rule.is_active });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Commission Rules</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Commission Rule' : 'Add Commission Rule'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard Referral"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commission_percent">Commission %</Label>
                  <Input
                    id="commission_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.commission_percent}
                    onChange={(e) => setFormData({ ...formData, commission_percent: parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_order_amount">Min Order Amount</Label>
                  <Input
                    id="min_order_amount"
                    type="number"
                    min="0"
                    value={formData.min_order_amount || ''}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="₹0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_commission_amount">Max Commission Amount (Optional)</Label>
                <Input
                  id="max_commission_amount"
                  type="number"
                  min="0"
                  value={formData.max_commission_amount || ''}
                  onChange={(e) => setFormData({ ...formData, max_commission_amount: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="No limit"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createRule.isPending || updateRule.isPending}
                >
                  {editingRule ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {rules?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No commission rules configured</p>
            <p className="text-sm mt-1">Add a rule to define referral commissions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules?.map((rule) => (
            <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{rule.name}</h4>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-indoor-events font-semibold">
                        <Percent className="h-4 w-4" />
                        {rule.commission_percent}%
                      </span>
                      {rule.min_order_amount && rule.min_order_amount > 0 && (
                        <span className="text-muted-foreground">
                          Min: ₹{rule.min_order_amount.toLocaleString()}
                        </span>
                      )}
                      {rule.max_commission_amount && (
                        <span className="text-muted-foreground">
                          Max: ₹{rule.max_commission_amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleActive(rule)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(rule)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commission Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The rule will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommissionRulesTab;
