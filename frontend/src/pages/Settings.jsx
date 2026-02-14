import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Mail, CreditCard, Bell, Shield, Globe, Database, ExternalLink, Save, RefreshCw } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    company_name: 'SOA East LLC',
    company_email: 'contact@soaeast.com',
    company_phone: '+1 (555) 123-4567',
    company_address: '123 Business Ave, Suite 100, City, State 12345',
    industry: 'Promotional Products',
    timezone: 'America/New_York',
    date_format: 'MM/DD/YYYY',
    currency: 'USD',
    tax_rate: 8.5,
    notifications: {
      push: true,
      desktop: false,
      sound: true
    },
    email_settings: {
      order_updates: true,
      new_clients: true,
      pipeline_movement: false,
      weekly_reports: true
    },
    security_settings: {
      two_factor: false,
      session_timeout: true
    }
  });

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Australia/Sydney'
  ];

  const dateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, {
        company_name: settings.company_name,
        company_email: settings.company_email,
        company_phone: settings.company_phone,
        company_address: settings.company_address,
        industry: settings.industry
      });
      toast.success('Company settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, {
        email_settings: settings.email_settings
      });
      toast.success('Email settings saved successfully');
    } catch (error) {
      toast.error('Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, {
        currency: settings.currency,
        tax_rate: settings.tax_rate
      });
      toast.success('Payment settings saved successfully');
    } catch (error) {
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await axios.put(`${API}/settings`, {
        notifications: settings.notifications
      });
      toast.success('Notification settings saved');
    } catch (error) {
      toast.error('Failed to save notification settings');
    }
  };

  const handleSaveSecurity = async () => {
    try {
      await axios.put(`${API}/settings`, {
        security_settings: settings.security_settings
      });
      toast.success('Security settings saved');
    } catch (error) {
      toast.error('Failed to save security settings');
    }
  };

  const handleSaveLocalization = async () => {
    try {
      await axios.put(`${API}/settings`, {
        timezone: settings.timezone,
        date_format: settings.date_format
      });
      toast.success('Localization settings saved');
    } catch (error) {
      toast.error('Failed to save localization settings');
    }
  };

  const handleExportData = async (type) => {
    try {
      const response = await axios.get(`${API}/export/${type}`);
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${response.data.count} ${type} exported successfully`);
    } catch (error) {
      toast.error(`Failed to export ${type}`);
    }
  };

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.success('Cache cleared successfully');
  };

  const updateEmailSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      email_settings: { ...prev.email_settings, [key]: value }
    }));
  };

  const updateNotification = (key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  const updateSecurity = (key, value) => {
    setSettings(prev => ({
      ...prev,
      security_settings: { ...prev.security_settings, [key]: value }
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crm-green"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TopBar
        breadcrumb="Management > Settings"
        title="Settings"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Profile */}
          <div className="crm-card p-6" data-testid="company-settings">
            <h3 className="font-medium text-lg mb-4">Company Profile</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="label-uppercase">Company Name</Label>
                <Input 
                  data-testid="company-name-input"
                  value={settings.company_name} 
                  onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                  className="bg-white" 
                />
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Industry</Label>
                <Input 
                  data-testid="industry-input"
                  value={settings.industry} 
                  onChange={(e) => setSettings({...settings, industry: e.target.value})}
                  className="bg-white" 
                />
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Email</Label>
                <Input 
                  data-testid="company-email-input"
                  type="email" 
                  value={settings.company_email} 
                  onChange={(e) => setSettings({...settings, company_email: e.target.value})}
                  className="bg-white" 
                />
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Phone</Label>
                <Input 
                  data-testid="company-phone-input"
                  value={settings.company_phone} 
                  onChange={(e) => setSettings({...settings, company_phone: e.target.value})}
                  className="bg-white" 
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label className="label-uppercase">Address</Label>
                <Input 
                  data-testid="company-address-input"
                  value={settings.company_address} 
                  onChange={(e) => setSettings({...settings, company_address: e.target.value})}
                  className="bg-white" 
                />
              </div>
            </div>
            <Button onClick={handleSaveCompany} disabled={saving} className="btn-primary mt-4" data-testid="save-company-btn">
              {saving ? <RefreshCw size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />}
              Save Changes
            </Button>
          </div>

          {/* Email Integration */}
          <div className="crm-card p-6" data-testid="email-integration">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-crm-green-light rounded-lg">
                <Mail size={20} className="text-crm-green" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Email Notifications</h3>
                <p className="text-sm text-crm-text-secondary">Configure email notifications and integrations</p>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order Updates</p>
                  <p className="text-sm text-crm-text-secondary">Receive emails when order status changes</p>
                </div>
                <Switch 
                  checked={settings.email_settings.order_updates} 
                  onCheckedChange={(v) => updateEmailSetting('order_updates', v)}
                  data-testid="email-order-updates" 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Client Alerts</p>
                  <p className="text-sm text-crm-text-secondary">Get notified when new clients are added</p>
                </div>
                <Switch 
                  checked={settings.email_settings.new_clients}
                  onCheckedChange={(v) => updateEmailSetting('new_clients', v)}
                  data-testid="email-new-clients" 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pipeline Movement</p>
                  <p className="text-sm text-crm-text-secondary">Alerts when deals move through pipeline</p>
                </div>
                <Switch 
                  checked={settings.email_settings.pipeline_movement}
                  onCheckedChange={(v) => updateEmailSetting('pipeline_movement', v)}
                  data-testid="email-pipeline" 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-crm-text-secondary">Receive weekly summary reports</p>
                </div>
                <Switch 
                  checked={settings.email_settings.weekly_reports}
                  onCheckedChange={(v) => updateEmailSetting('weekly_reports', v)}
                  data-testid="email-reports" 
                />
              </div>
            </div>

            <Button onClick={handleSaveEmailSettings} disabled={saving} variant="outline" className="btn-secondary mt-4" data-testid="save-email-btn">
              <Save size={14} className="mr-2" /> Save Email Settings
            </Button>

            <Separator className="my-4" />

            <div className="p-4 bg-crm-bg rounded-xl">
              <p className="label-uppercase text-[9px] mb-2">Email Provider</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-crm-text-secondary">Connect your email service provider</p>
                <Button variant="outline" size="sm" className="btn-secondary" data-testid="connect-email-btn" onClick={() => window.location.href = '/integrations'}>
                  <ExternalLink size={14} className="mr-2" /> Connect
                </Button>
              </div>
            </div>
          </div>

          {/* Payment Integration */}
          <div className="crm-card p-6" data-testid="payment-integration">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CreditCard size={20} className="text-crm-blue" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Payment Processing</h3>
                <p className="text-sm text-crm-text-secondary">Configure payment gateways and invoicing</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid sm:grid-cols-2 gap-4">
              <div 
                className="p-4 border border-crm-border rounded-xl hover:border-crm-green transition-colors cursor-pointer" 
                data-testid="stripe-connect"
                onClick={() => window.location.href = '/integrations'}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#635BFF] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div>
                    <p className="font-medium">Stripe</p>
                    <p className="text-xs text-crm-text-secondary">Credit cards, ACH</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full btn-secondary mt-2">
                  Connect Stripe
                </Button>
              </div>

              <div 
                className="p-4 border border-crm-border rounded-xl hover:border-crm-green transition-colors cursor-pointer" 
                data-testid="paypal-connect"
                onClick={() => window.location.href = '/integrations'}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#003087] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <div>
                    <p className="font-medium">PayPal</p>
                    <p className="text-xs text-crm-text-secondary">PayPal, Venmo</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full btn-secondary mt-2">
                  Connect PayPal
                </Button>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="label-uppercase">Default Currency</Label>
                <Select value={settings.currency} onValueChange={(v) => setSettings({...settings, currency: v})}>
                  <SelectTrigger data-testid="currency-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Tax Rate (%)</Label>
                <Input 
                  data-testid="tax-rate-input"
                  type="number" 
                  step="0.1"
                  value={settings.tax_rate} 
                  onChange={(e) => setSettings({...settings, tax_rate: parseFloat(e.target.value) || 0})}
                  className="bg-white" 
                />
              </div>
            </div>
            <Button onClick={handleSavePaymentSettings} disabled={saving} variant="outline" className="btn-secondary mt-4" data-testid="save-payment-btn">
              <Save size={14} className="mr-2" /> Save Payment Settings
            </Button>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="crm-card p-6" data-testid="notification-settings">
            <div className="flex items-center gap-3 mb-4">
              <Bell size={20} className="text-crm-warning" />
              <h3 className="font-medium">Notifications</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Push Notifications</span>
                <Switch 
                  checked={settings.notifications.push}
                  onCheckedChange={(v) => updateNotification('push', v)}
                  data-testid="push-notifications"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Desktop Alerts</span>
                <Switch 
                  checked={settings.notifications.desktop}
                  onCheckedChange={(v) => updateNotification('desktop', v)}
                  data-testid="desktop-alerts"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sound</span>
                <Switch 
                  checked={settings.notifications.sound}
                  onCheckedChange={(v) => updateNotification('sound', v)}
                  data-testid="sound-notifications"
                />
              </div>
            </div>
            <Button onClick={handleSaveNotifications} variant="outline" size="sm" className="w-full btn-secondary mt-4" data-testid="save-notifications-btn">
              Save Notifications
            </Button>
          </div>

          {/* Security */}
          <div className="crm-card p-6" data-testid="security-settings">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={20} className="text-crm-green" />
              <h3 className="font-medium">Security</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Two-Factor Auth</span>
                <Switch 
                  checked={settings.security_settings.two_factor}
                  onCheckedChange={(v) => updateSecurity('two_factor', v)}
                  data-testid="two-factor-auth"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Session Timeout</span>
                <Switch 
                  checked={settings.security_settings.session_timeout}
                  onCheckedChange={(v) => updateSecurity('session_timeout', v)}
                  data-testid="session-timeout"
                />
              </div>
            </div>
            <Button onClick={handleSaveSecurity} variant="outline" size="sm" className="w-full btn-secondary mt-4" data-testid="save-security-btn">
              Save Security
            </Button>
            <Button variant="outline" size="sm" className="w-full btn-secondary mt-2" data-testid="change-password-btn">
              Change Password
            </Button>
          </div>

          {/* Localization */}
          <div className="crm-card p-6" data-testid="localization-settings">
            <div className="flex items-center gap-3 mb-4">
              <Globe size={20} className="text-crm-blue" />
              <h3 className="font-medium">Localization</h3>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-crm-text-secondary">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(v) => setSettings({...settings, timezone: v})}>
                  <SelectTrigger data-testid="timezone-select" className="bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-crm-text-secondary">Date Format</Label>
                <Select value={settings.date_format} onValueChange={(v) => setSettings({...settings, date_format: v})}>
                  <SelectTrigger data-testid="date-format-select" className="bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFormats.map(df => <SelectItem key={df} value={df}>{df}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSaveLocalization} variant="outline" size="sm" className="w-full btn-secondary mt-4" data-testid="save-localization-btn">
              Save Localization
            </Button>
          </div>

          {/* Database */}
          <div className="crm-card p-6" data-testid="database-settings">
            <div className="flex items-center gap-3 mb-4">
              <Database size={20} className="text-crm-purple" />
              <h3 className="font-medium">Data Export</h3>
            </div>
            <div className="space-y-2">
              <Button onClick={() => handleExportData('clients')} variant="outline" size="sm" className="w-full btn-secondary" data-testid="export-clients-btn">
                Export Clients
              </Button>
              <Button onClick={() => handleExportData('orders')} variant="outline" size="sm" className="w-full btn-secondary" data-testid="export-orders-btn">
                Export Orders
              </Button>
              <Button onClick={() => handleExportData('deals')} variant="outline" size="sm" className="w-full btn-secondary" data-testid="export-deals-btn">
                Export Deals
              </Button>
              <Button onClick={() => handleExportData('products')} variant="outline" size="sm" className="w-full btn-secondary" data-testid="export-products-btn">
                Export Products
              </Button>
              <Button onClick={handleClearCache} variant="outline" size="sm" className="w-full text-crm-danger border-crm-danger hover:bg-red-50" data-testid="clear-cache-btn">
                Clear Cache
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
