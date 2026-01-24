import React, { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  Users,
  Key,
  Film,
  Coins,
  LayoutDashboard,
  Plus,
  Trash2,
  Edit,
  Loader2,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
  Ticket,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// Dashboard Overview
const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, apiKeysRes, modelsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('api_keys').select('id, credits, is_active, provider'),
        supabase.from('video_models').select('id'),
      ]);

      const activeKeys = apiKeysRes.data?.filter((k) => k.is_active) || [];
      const server1Credits = apiKeysRes.data
        ?.filter((k) => k.provider === 'fal_ai')
        .reduce((sum, k) => sum + Number(k.credits), 0) || 0;
      const server2Credits = apiKeysRes.data
        ?.filter((k) => k.provider === 'gmicloud')
        .reduce((sum, k) => sum + Number(k.credits), 0) || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalApiKeys: apiKeysRes.data?.length || 0,
        activeApiKeys: activeKeys.length,
        server1Credits,
        server2Credits,
        totalModels: modelsRes.data?.length || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users },
    { label: 'API Keys', value: `${stats?.activeApiKeys}/${stats?.totalApiKeys}`, icon: Key },
    { label: 'Server 1 Credits', value: stats?.server1Credits?.toLocaleString() || '0', icon: Coins },
    { label: 'Server 2 Credits', value: stats?.server2Credits?.toLocaleString() || '0', icon: Coins },
    { label: 'Video Models', value: stats?.totalModels || 0, icon: Film },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-6 space-y-2"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <stat.icon size={20} />
              <span className="text-sm">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// API Keys Management
const ApiKeysManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'fal_ai' as 'fal_ai' | 'gmicloud',
    api_key: '',
    credits: 0,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('api_keys').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({ title: 'API Key created successfully' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from('api_keys').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({ title: 'API Key updated successfully' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({ title: 'API Key deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', provider: 'fal_ai', api_key: '', credits: 0 });
    setEditingKey(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingKey) {
      updateMutation.mutate({ id: editingKey.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (key: any) => {
    setEditingKey(key);
    setFormData({
      name: key.name,
      provider: key.provider,
      api_key: key.api_key,
      credits: key.credits,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">API Keys</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus size={16} /> Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingKey ? 'Edit' : 'Add'} API Key</DialogTitle>
              <DialogDescription>
                {editingKey ? 'Update the API key details.' : 'Add a new API key for video generation.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My API Key"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(v) => setFormData({ ...formData, provider: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fal_ai">fal.ai (Server 1)</SelectItem>
                    <SelectItem value="gmicloud">GMI Cloud (Server 2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="sk-..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits">Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  step="0.01"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  )}
                  {editingKey ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys?.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        key.provider === 'fal_ai'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent/10 text-accent'
                      )}
                    >
                      {key.provider === 'fal_ai' ? 'fal.ai' : 'GMI Cloud'}
                    </span>
                  </TableCell>
                  <TableCell>{Number(key.credits).toLocaleString()}</TableCell>
                  <TableCell>
                    <button
                      onClick={() =>
                        toggleActiveMutation.mutate({ id: key.id, is_active: !key.is_active })
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {key.is_active ? (
                        <ToggleRight size={24} className="text-success" />
                      ) : (
                        <ToggleLeft size={24} />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(key.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(key)}>
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(key.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!apiKeys || apiKeys.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No API keys found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

// Users Management
const UsersManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Fetch profiles first
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (profilesError) throw profilesError;

      // Fetch roles and credits separately
      const userIds = profiles?.map((p) => p.user_id) || [];
      
      const [rolesRes, creditsRes] = await Promise.all([
        supabase.from('user_roles').select('*').in('user_id', userIds),
        supabase.from('user_credits').select('*').in('user_id', userIds),
      ]);

      // Combine data
      return profiles?.map((profile) => ({
        ...profile,
        role: rolesRes.data?.find((r) => r.user_id === profile.user_id)?.role || 'user',
        balance: creditsRes.data?.find((c) => c.user_id === profile.user_id)?.balance || 0,
      }));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'premium' | 'user' }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'User role updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateCreditsMutation = useMutation({
    mutationFn: async ({ userId, balance }: { userId: string; balance: number }) => {
      const { error } = await supabase
        .from('user_credits')
        .update({ balance })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'User credits updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Users</h2>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.display_name || '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(role) =>
                        updateRoleMutation.mutate({ 
                          userId: user.user_id, 
                          role: role as 'admin' | 'premium' | 'user' 
                        })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-24"
                      defaultValue={Number(user.balance) || 0}
                      onBlur={(e) =>
                        updateCreditsMutation.mutate({
                          userId: user.user_id,
                          balance: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

// Models Management placeholder
const ModelsManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Video Models</h2>
      <p className="text-muted-foreground">
        Models will be seeded from the initial data. You can enable/disable models and adjust pricing here.
      </p>
    </div>
  );
};

// Vouchers Management
const VouchersManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ code: '', credits: 5 });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vouchers, isLoading } = useQuery({
    queryKey: ['vouchers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { code: string; credits: number }) => {
      const { error } = await supabase.from('vouchers').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast({ title: 'Voucher created successfully' });
      setIsDialogOpen(false);
      setFormData({ code: '', credits: 5 });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vouchers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast({ title: 'Voucher deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Code copied to clipboard' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return;
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Vouchers</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} /> Create Voucher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Voucher</DialogTitle>
              <DialogDescription>
                Create a new voucher code for users to redeem credits.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Voucher Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="XXXX-XXXX"
                    required
                    className="font-mono"
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    Generate
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits">Credits Amount</Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="animate-spin mr-2" size={16} />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers?.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="font-mono bg-muted px-2 py-1 rounded">{voucher.code}</code>
                      <button
                        onClick={() => copyCode(voucher.code)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Coins size={14} className="text-primary" />
                      <span>{voucher.credits.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(voucher.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(voucher.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!vouchers || vouchers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No vouchers found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

// Main Admin Panel
const AdminPanel: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'API Keys', path: '/admin/api-keys', icon: Key },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Vouchers', path: '/admin/vouchers', icon: Ticket },
    { label: 'Models', path: '/admin/models', icon: Film },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground">Manage API keys, users, vouchers, and models.</p>
      </div>

      {/* Sub navigation */}
      <div className="flex gap-2 border-b border-border pb-4 overflow-x-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/api-keys" element={<ApiKeysManagement />} />
        <Route path="/users" element={<UsersManagement />} />
        <Route path="/vouchers" element={<VouchersManagement />} />
        <Route path="/models" element={<ModelsManagement />} />
      </Routes>
    </div>
  );
};

export default AdminPanel;
