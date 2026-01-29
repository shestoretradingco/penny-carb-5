import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Panchayat, Ward } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AdminLocations: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Panchayat Dialog
  const [isPanchayatDialogOpen, setIsPanchayatDialogOpen] = useState(false);
  const [editingPanchayat, setEditingPanchayat] = useState<Panchayat | null>(null);
  const [panchayatFormData, setPanchayatFormData] = useState({ name: '', code: '' });
  
  // Ward Dialog
  const [isWardDialogOpen, setIsWardDialogOpen] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [wardFormData, setWardFormData] = useState({ 
    name: '', 
    ward_number: '', 
    panchayat_id: '' 
  });

  const isAdmin = role === 'super_admin' || role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [panchayatsRes, wardsRes] = await Promise.all([
        supabase.from('panchayats').select('*').order('name'),
        supabase.from('wards').select('*').order('ward_number'),
      ]);

      if (panchayatsRes.data) setPanchayats(panchayatsRes.data as Panchayat[]);
      if (wardsRes.data) setWards(wardsRes.data as Ward[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Panchayat handlers
  const handleOpenPanchayatDialog = (panchayat?: Panchayat) => {
    if (panchayat) {
      setEditingPanchayat(panchayat);
      setPanchayatFormData({ name: panchayat.name, code: panchayat.code || '' });
    } else {
      setEditingPanchayat(null);
      setPanchayatFormData({ name: '', code: '' });
    }
    setIsPanchayatDialogOpen(true);
  };

  const handleSavePanchayat = async () => {
    if (!panchayatFormData.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    try {
      if (editingPanchayat) {
        const { error } = await supabase
          .from('panchayats')
          .update({ 
            name: panchayatFormData.name, 
            code: panchayatFormData.code || null 
          })
          .eq('id', editingPanchayat.id);

        if (error) throw error;
        toast({ title: 'Panchayat updated' });
      } else {
        const { error } = await supabase
          .from('panchayats')
          .insert({ 
            name: panchayatFormData.name, 
            code: panchayatFormData.code || null 
          });

        if (error) throw error;
        toast({ title: 'Panchayat created' });
      }

      setIsPanchayatDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving panchayat:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePanchayat = async (panchayat: Panchayat) => {
    if (!confirm(`Delete "${panchayat.name}"? This will also delete all associated wards.`)) return;

    try {
      const { error } = await supabase
        .from('panchayats')
        .delete()
        .eq('id', panchayat.id);

      if (error) throw error;
      toast({ title: 'Panchayat deleted' });
      fetchData();
    } catch (error) {
      console.error('Error deleting panchayat:', error);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  // Ward handlers
  const handleOpenWardDialog = (panchayatId: string, ward?: Ward) => {
    if (ward) {
      setEditingWard(ward);
      setWardFormData({ 
        name: ward.name, 
        ward_number: ward.ward_number?.toString() || '', 
        panchayat_id: ward.panchayat_id 
      });
    } else {
      setEditingWard(null);
      setWardFormData({ name: '', ward_number: '', panchayat_id: panchayatId });
    }
    setIsWardDialogOpen(true);
  };

  const handleSaveWard = async () => {
    if (!wardFormData.name || !wardFormData.panchayat_id) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    try {
      const wardData = {
        name: wardFormData.name,
        ward_number: wardFormData.ward_number ? parseInt(wardFormData.ward_number) : null,
        panchayat_id: wardFormData.panchayat_id,
      };

      if (editingWard) {
        const { error } = await supabase
          .from('wards')
          .update(wardData)
          .eq('id', editingWard.id);

        if (error) throw error;
        toast({ title: 'Ward updated' });
      } else {
        const { error } = await supabase
          .from('wards')
          .insert(wardData);

        if (error) throw error;
        toast({ title: 'Ward created' });
      }

      setIsWardDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving ward:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteWard = async (ward: Ward) => {
    if (!confirm(`Delete "${ward.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('wards')
        .delete()
        .eq('id', ward.id);

      if (error) throw error;
      toast({ title: 'Ward deleted' });
      fetchData();
    } catch (error) {
      console.error('Error deleting ward:', error);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const getWardsForPanchayat = (panchayatId: string) => {
    return wards.filter(w => w.panchayat_id === panchayatId);
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display text-lg font-semibold">Locations</h1>
          </div>
          <Button size="sm" onClick={() => handleOpenPanchayatDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Panchayat
          </Button>
        </div>
      </header>

      <main className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : panchayats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MapPin className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">No locations yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add panchayats and wards to get started
            </p>
            <Button className="mt-4" onClick={() => handleOpenPanchayatDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Panchayat
            </Button>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {panchayats.map((panchayat) => {
              const panchayatWards = getWardsForPanchayat(panchayat.id);
              
              return (
                <AccordionItem 
                  key={panchayat.id} 
                  value={panchayat.id}
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex flex-1 items-center justify-between pr-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{panchayat.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {panchayatWards.length} wards
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Badge variant={panchayat.is_active ? 'default' : 'secondary'}>
                          {panchayat.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenPanchayatDialog(panchayat)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeletePanchayat(panchayat)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-muted-foreground">Wards</h4>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleOpenWardDialog(panchayat.id)}
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Add Ward
                        </Button>
                      </div>
                      {panchayatWards.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          No wards added yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {panchayatWards.map((ward) => (
                            <div 
                              key={ward.id}
                              className="flex items-center justify-between rounded-lg bg-secondary/50 p-3"
                            >
                              <div>
                                <p className="font-medium">
                                  {ward.ward_number && `Ward ${ward.ward_number}: `}
                                  {ward.name}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleOpenWardDialog(panchayat.id, ward)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleDeleteWard(ward)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </main>

      {/* Panchayat Dialog */}
      <Dialog open={isPanchayatDialogOpen} onOpenChange={setIsPanchayatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPanchayat ? 'Edit Panchayat' : 'Add Panchayat'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="panchayat-name">Name *</Label>
              <Input
                id="panchayat-name"
                value={panchayatFormData.name}
                onChange={(e) => setPanchayatFormData({ ...panchayatFormData, name: e.target.value })}
                placeholder="Enter panchayat name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="panchayat-code">Code (optional)</Label>
              <Input
                id="panchayat-code"
                value={panchayatFormData.code}
                onChange={(e) => setPanchayatFormData({ ...panchayatFormData, code: e.target.value })}
                placeholder="e.g., PNC001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPanchayatDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePanchayat}>
              {editingPanchayat ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ward Dialog */}
      <Dialog open={isWardDialogOpen} onOpenChange={setIsWardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWard ? 'Edit Ward' : 'Add Ward'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ward-name">Name *</Label>
              <Input
                id="ward-name"
                value={wardFormData.name}
                onChange={(e) => setWardFormData({ ...wardFormData, name: e.target.value })}
                placeholder="Enter ward name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ward-number">Ward Number</Label>
              <Input
                id="ward-number"
                type="number"
                value={wardFormData.ward_number}
                onChange={(e) => setWardFormData({ ...wardFormData, ward_number: e.target.value })}
                placeholder="e.g., 1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWardDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWard}>
              {editingWard ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLocations;
