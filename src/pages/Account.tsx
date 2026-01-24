import React from 'react';
import { User, Shield, CreditCard, Bell } from 'lucide-react';

const Account: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Account Settings</h2>
        <p className="text-muted-foreground">Manage your profile and preferences.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full gradient-brand p-1">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                <User size={40} className="text-muted-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Demo User</h3>
              <p className="text-primary text-sm">Pro Plan</p>
            </div>
            <button className="w-full py-2 bg-muted border border-border hover:border-primary text-muted-foreground hover:text-foreground rounded-lg text-sm font-medium transition-colors">
              Edit Profile
            </button>
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
            <SettingItem label="Current Plan" value="BS30 Pro ($29/mo)" />
            <SettingItem label="Next Billing Date" value="Oct 15, 2025" />
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
