import React, { useState, useEffect } from 'react';
import { User, Shield, CreditCard, Bell, Ticket, Coins, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Account: React.FC = () => {
  const { user, credits, refreshCredits } = useAuth();
  const { toast } = useToast();
  const [voucherCode, setVoucherCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMinutesRemaining, setLockMinutesRemaining] = useState(0);

  // Check if user is locked out
  useEffect(() => {
    const checkLockStatus = async () => {
      if (!user) return;
      
      const { data: attempts } = await supabase
        .from('voucher_redemption_attempts')
        .select('attempted_at')
        .eq('user_id', user.id)
        .gte('attempted_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('attempted_at', { ascending: false })
        .limit(3);

      if (attempts && attempts.length >= 3) {
        setIsLocked(true);
        const oldestAttempt = new Date(attempts[2].attempted_at);
        const unlockTime = new Date(oldestAttempt.getTime() + 60 * 60 * 1000);
        const remaining = Math.ceil((unlockTime.getTime() - Date.now()) / (60 * 1000));
        setLockMinutesRemaining(Math.max(0, remaining));
      } else {
        setIsLocked(false);
        setLockMinutesRemaining(0);
      }
    };

    checkLockStatus();
    const interval = setInterval(checkLockStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim() || !user) return;

    if (isLocked) {
      toast({
        title: 'Akun terkunci',
        description: `Terlalu banyak percobaan gagal. Coba lagi dalam ${lockMinutesRemaining} menit.`,
        variant: 'destructive',
      });
      return;
    }

    setIsRedeeming(true);
    try {
      // Check if voucher exists and is active
      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode.toUpperCase())
        .eq('status', 'active')
        .single();

      if (voucherError || !voucher) {
        // Log failed attempt
        await supabase
          .from('voucher_redemption_attempts')
          .insert({ user_id: user.id, attempted_code: voucherCode.toUpperCase() });

        // Recheck lock status
        const { data: attempts } = await supabase
          .from('voucher_redemption_attempts')
          .select('attempted_at')
          .eq('user_id', user.id)
          .gte('attempted_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

        if (attempts && attempts.length >= 3) {
          setIsLocked(true);
          setLockMinutesRemaining(60);
          toast({
            title: 'Akun terkunci',
            description: 'Terlalu banyak percobaan gagal. Akun Anda dikunci selama 1 jam.',
            variant: 'destructive',
          });
        } else {
          const remainingAttempts = 3 - (attempts?.length || 0);
          toast({
            title: 'Voucher tidak valid',
            description: `Kode voucher tidak ditemukan atau sudah digunakan. Sisa percobaan: ${remainingAttempts}`,
            variant: 'destructive',
          });
        }
        return;
      }

      // Add credits to user
      const { data: currentCredits } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      const newBalance = (Number(currentCredits?.balance) || 0) + voucher.credits;

      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update voucher status to redeemed (instead of deleting)
      const { error: redeemError } = await supabase
        .from('vouchers')
        .update({ 
          status: 'redeemed',
          redeemed_by: user.id,
          redeemed_at: new Date().toISOString()
        })
        .eq('id', voucher.id);

      if (redeemError) throw redeemError;

      // Refresh credits in context
      await refreshCredits();

      toast({
        title: 'Voucher berhasil diredeem!',
        description: `${voucher.credits.toLocaleString()} kredit telah ditambahkan ke akun Anda.`,
      });

      setVoucherCode('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Account Settings</h2>
        <p className="text-muted-foreground">Manage your profile and preferences.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full gradient-brand p-1">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                <User size={40} className="text-muted-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
              </h3>
              <p className="text-primary text-sm">{user?.email}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-foreground">
              <Coins size={20} className="text-primary" />
              <span className="font-bold text-lg">{credits.toLocaleString()}</span>
              <span className="text-muted-foreground text-sm">kredit</span>
            </div>
            <button className="w-full py-2 bg-muted border border-border hover:border-primary text-muted-foreground hover:text-foreground rounded-lg text-sm font-medium transition-colors">
              Edit Profile
            </button>
          </div>

          {/* Redeem Voucher Card */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <Ticket size={20} className="text-primary" />
              <h3 className="font-bold">Redeem Voucher</h3>
            </div>
            {isLocked ? (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center space-y-2">
                <Lock size={24} className="mx-auto text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  Akun terkunci karena terlalu banyak percobaan gagal
                </p>
                <p className="text-xs text-muted-foreground">
                  Coba lagi dalam {lockMinutesRemaining} menit
                </p>
              </div>
            ) : (
              <form onSubmit={handleRedeemVoucher} className="space-y-3">
                <Input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode voucher"
                  className="font-mono text-center"
                />
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={isRedeeming || !voucherCode.trim()}
                >
                  {isRedeeming ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Redeem'
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Settings List */}
        <div className="md:col-span-2 space-y-4">
          <Section
            title="Security"
            icon={<Shield size={20} className="text-success" />}
          >
            <SettingItem label="Two-Factor Authentication" value="Enabled" />
            <SettingItem label="Password" value="Last changed 30 days ago" />
          </Section>

          <Section
            title="Billing"
            icon={<CreditCard size={20} className="text-accent" />}
          >
            <SettingItem label="Current Plan" value="BS30 Pro" />
            <SettingItem label="Credits Balance" value={`${credits.toLocaleString()} kredit`} />
          </Section>

          <Section
            title="Notifications"
            icon={<Bell size={20} className="text-warning" />}
          >
            <SettingItem label="Email Notifications" value="On" />
            <SettingItem label="Generation Alerts" value="Off" />
          </Section>
        </div>
      </div>
    </div>
  );
};

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    <div className="px-6 py-4 border-b border-border flex items-center gap-3">
      {icon}
      <h3 className="font-bold text-foreground">{title}</h3>
    </div>
    <div className="divide-y divide-border">{children}</div>
  </div>
);

interface SettingItemProps {
  label: string;
  value: string;
}

const SettingItem: React.FC<SettingItemProps> = ({ label, value }) => (
  <div className="px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
    <span className="text-muted-foreground text-sm">{label}</span>
    <span className="text-foreground font-medium text-sm">{value}</span>
  </div>
);

export default Account;
