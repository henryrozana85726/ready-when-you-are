import React, { useState, useMemo } from 'react';
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
  Search,
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<'all' | 'fal_ai' | 'gmicloud'>('all');
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

  // Filter API keys based on search query and provider filter
  const filteredApiKeys = useMemo(() => {
    if (!apiKeys) return [];
    
    return apiKeys.filter((key) => {
      const matchesSearch = searchQuery.trim() === '' || 
        key.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesProvider = providerFilter === 'all' || key.provider === providerFilter;
      
      return matchesSearch && matchesProvider;
    });
  }, [apiKeys, searchQuery, providerFilter]);

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={providerFilter}
          onValueChange={(v) => setProviderFilter(v as typeof providerFilter)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            <SelectItem value="fal_ai">fal.ai (Server 1)</SelectItem>
            <SelectItem value="gmicloud">GMI Cloud (Server 2)</SelectItem>
          </SelectContent>
        </Select>
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
              {filteredApiKeys?.map((key) => (
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
                  <TableCell>
                    <span className={cn(
                      'font-medium',
                      Number(key.credits) < 0.3 && 'text-destructive'
                    )}>
                      {Number(key.credits).toLocaleString()}
                    </span>
                    {Number(key.credits) < 0.3 && (
                      <span className="ml-2 px-2 py-0.5 rounded text-xs bg-destructive/10 text-destructive">
                        Low
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {Number(key.credits) < 0.3 ? (
                      <div className="flex items-center gap-2">
                        <ToggleLeft size={24} className="text-muted-foreground/50" />
                        <span className="text-xs text-destructive">Disabled</span>
                      </div>
                    ) : (
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
                    )}
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
                      onClick={() => {
                        setKeyToDelete({ id: key.id, name: key.name });
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredApiKeys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchQuery || providerFilter !== 'all' ? 'No API keys match your search criteria.' : 'No API keys found. Add one to get started.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete API Key Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{keyToDelete?.name}</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setKeyToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (keyToDelete) {
                  deleteMutation.mutate(keyToDelete.id);
                  setDeleteDialogOpen(false);
                  setKeyToDelete(null);
                }
              }}
            >
              {deleteMutation.isPending && <Loader2 className="animate-spin mr-2" size={16} />}
              Delete API Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Users Management
const UsersManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'premium' | 'user'>('all');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'user' as 'admin' | 'premium' | 'user',
    credits: 0,
  });
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

  // Filter users based on search query and role filter
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter((user) => {
      const matchesSearch = searchQuery.trim() === '' || 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Use edge function to create user (admin only)
      const { data: result, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: data.email,
          password: data.password,
          displayName: data.displayName,
          role: data.role,
          credits: data.credits,
        },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({ title: 'User created successfully' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Use edge function to delete user (admin only)
      const { data: result, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({ title: 'User deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      displayName: '',
      role: 'user',
      credits: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Users</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus size={16} /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with specified role and credits.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-displayName">Display Name</Label>
                <Input
                  id="user-displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-credits">Initial Credits</Label>
                <Input
                  id="user-credits"
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
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending && (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  )}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
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
                <TableHead>Email</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user) => (
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setUserToDelete({ id: user.user_id, email: user.email || 'Unknown' });
                        setDeleteDialogOpen(true);
                      }}
                      disabled={deleteUserMutation.isPending}
                    >
                      {deleteUserMutation.isPending ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchQuery || roleFilter !== 'all' ? 'No users match your search criteria.' : 'No users found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{userToDelete?.email}</span>? 
              This action cannot be undone and will permanently remove the user account along with all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (userToDelete) {
                  deleteUserMutation.mutate(userToDelete.id);
                  setDeleteDialogOpen(false);
                  setUserToDelete(null);
                }
              }}
            >
              {deleteUserMutation.isPending && <Loader2 className="animate-spin mr-2" size={16} />}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<{ id: string; code: string } | null>(null);
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
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Redeemed</TableHead>
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
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      voucher.status === 'active' ? 'bg-success/20 text-success' :
                      voucher.status === 'redeemed' ? 'bg-primary/20 text-primary' :
                      voucher.status === 'expired' ? 'bg-muted text-muted-foreground' :
                      voucher.status === 'blocked' ? 'bg-destructive/20 text-destructive' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {voucher.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(voucher.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {voucher.redeemed_at ? (
                      <span>{new Date(voucher.redeemed_at).toLocaleString()}</span>
                    ) : (
                      <span className="text-muted-foreground/50">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      disabled={voucher.status === 'redeemed'}
                      onClick={() => {
                        setVoucherToDelete({ id: voucher.id, code: voucher.code });
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!vouchers || vouchers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No vouchers found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Voucher Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Voucher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete voucher <code className="font-mono bg-muted px-1 py-0.5 rounded">{voucherToDelete?.code}</code>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVoucherToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (voucherToDelete) {
                  deleteMutation.mutate(voucherToDelete.id);
                  setDeleteDialogOpen(false);
                  setVoucherToDelete(null);
                }
              }}
            >
              {deleteMutation.isPending && <Loader2 className="animate-spin mr-2" size={16} />}
              Delete Voucher
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
