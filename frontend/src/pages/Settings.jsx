import React from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { Mail, CreditCard, Bell, Shield, Globe, Database, ExternalLink } from 'lucide-react';

const Settings = () => {
  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

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
                <Input defaultValue="SOA East LLC" className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Industry</Label>
                <Input defaultValue="Promotional Products" className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Email</Label>
                <Input type="email" defaultValue="contact@soaeast.com" className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Phone</Label>
                <Input defaultValue="+1 (555) 123-4567" className="bg-white" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label className="label-uppercase">Address</Label>
                <Input defaultValue="123 Business Ave, Suite 100, City, State 12345" className="bg-white" />
              </div>
            </div>
            <Button onClick={handleSave} className="btn-primary mt-4">Save Changes</Button>
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
                <Switch defaultChecked data-testid="email-order-updates" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Client Alerts</p>
                  <p className="text-sm text-crm-text-secondary">Get notified when new clients are added</p>
                </div>
                <Switch defaultChecked data-testid="email-new-clients" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pipeline Movement</p>
                  <p className="text-sm text-crm-text-secondary">Alerts when deals move through pipeline</p>
                </div>
                <Switch data-testid="email-pipeline" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-crm-text-secondary">Receive weekly summary reports</p>
                </div>
                <Switch defaultChecked data-testid="email-reports" />
              </div>
            </div>

            <Separator className="my-4" />

            <div className="p-4 bg-crm-bg rounded-xl">
              <p className="label-uppercase text-[9px] mb-2">Email Provider</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-crm-text-secondary">Connect your email service provider</p>
                <Button variant="outline" size="sm" className="btn-secondary" data-testid="connect-email-btn">
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
              <div className="p-4 border border-crm-border rounded-xl hover:border-crm-green transition-colors cursor-pointer" data-testid="stripe-connect">
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

              <div className="p-4 border border-crm-border rounded-xl hover:border-crm-green transition-colors cursor-pointer" data-testid="paypal-connect">
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

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="label-uppercase">Default Currency</Label>
                <Input defaultValue="USD" className="bg-white max-w-[200px]" />
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Tax Rate (%)</Label>
                <Input type="number" defaultValue="8.5" className="bg-white max-w-[200px]" />
              </div>
            </div>
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
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Desktop Alerts</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sound</span>
                <Switch defaultChecked />
              </div>
            </div>
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
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Session Timeout</span>
                <Switch defaultChecked />
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full btn-secondary mt-4">
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
                <Input defaultValue="America/New_York" className="bg-white text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-crm-text-secondary">Date Format</Label>
                <Input defaultValue="MM/DD/YYYY" className="bg-white text-sm" />
              </div>
            </div>
          </div>

          {/* Database */}
          <div className="crm-card p-6" data-testid="database-settings">
            <div className="flex items-center gap-3 mb-4">
              <Database size={20} className="text-crm-purple" />
              <h3 className="font-medium">Data</h3>
            </div>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full btn-secondary">
                Export All Data
              </Button>
              <Button variant="outline" size="sm" className="w-full text-crm-danger border-crm-danger hover:bg-red-50">
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
