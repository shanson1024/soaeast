import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Plus, Monitor, CreditCard, Mail, Truck, BarChart3, Users, Check, X, RefreshCw, Trash2, Settings, ExternalLink } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const integrationIcons = {
  payment: CreditCard,
  email: Mail,
  shipping: Truck,
  analytics: BarChart3,
  crm: Users
};

const integrationProviders = {
  payment: ['Stripe', 'PayPal', 'Square', 'Authorize.net'],
  email: ['SendGrid', 'Mailchimp', 'Resend', 'Postmark'],
  shipping: ['ShipStation', 'Shippo', 'EasyPost', 'UPS'],
  analytics: ['Google Analytics', 'Mixpanel', 'Amplitude', 'Segment'],
  crm: ['Salesforce', 'HubSpot', 'Zoho', 'Pipedrive']
};

const Integrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    integration_type: 'payment',
    provider: '',
    api_key: '',
    webhook_url: '',
    settings: {},
    status: 'inactive'
  });

  const integrationTypes = ['payment', 'email', 'shipping', 'analytics', 'crm'];

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await axios.get(`${API}/integrations`);
      setIntegrations(response.data);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      integration_type: 'payment',
      provider: '',
      api_key: '',
      webhook_url: '',
      settings: {},
      status: 'inactive'
    });
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/integrations`, {
        ...formData,
        name: formData.name || `${formData.provider} Integration`
      });
      toast.success('Integration added successfully');
      handleCloseModal();
      fetchIntegrations();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add integration');
    }
  };

  const handleTestIntegration = async (integrationId) => {
    setTestingId(integrationId);
    try {
      const response = await axios.post(`${API}/integrations/${integrationId}/test`);
      toast.success(response.data.message);
      fetchIntegrations();
    } catch (error) {
      toast.error('Integration test failed');
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteIntegration = async (integrationId) => {
    if (!window.confirm('Are you sure you want to remove this integration?')) return;
    try {
      await axios.delete(`${API}/integrations/${integrationId}`);
      toast.success('Integration removed');
      fetchIntegrations();
    } catch (error) {
      toast.error('Failed to remove integration');
    }
  };

  const handleToggleStatus = async (integration) => {
    try {
      const newStatus = integration.status === 'active' ? 'inactive' : 'active';
      await axios.put(`${API}/integrations/${integration.id}`, { status: newStatus });
      toast.success(`Integration ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
      fetchIntegrations();
    } catch (error) {
      toast.error('Failed to update integration');
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      payment: 'bg-green-100 text-green-700',
      email: 'bg-blue-100 text-blue-700',
      shipping: 'bg-amber-100 text-amber-700',
      analytics: 'bg-purple-100 text-purple-700',
      crm: 'bg-pink-100 text-pink-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const stats = {
    total: integrations.length,
    active: integrations.filter(i => i.status === 'active').length,
    payment: integrations.filter(i => i.integration_type === 'payment').length,
    email: integrations.filter(i => i.integration_type === 'email').length
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
        breadcrumb="Management > Integrations"
        title="Integrations"
        actions={
          <Button data-testid="add-integration-btn" className="btn-primary" onClick={handleOpenModal}>
            <Plus size={16} className="mr-2" /> Add Integration
          </Button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="integration-stats">
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-crm-green-light rounded-xl">
            <Monitor size={20} className="text-crm-green" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Total Integrations</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Check size={20} className="text-crm-blue" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Active</p>
            <p className="text-2xl font-bold">{stats.active}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <CreditCard size={20} className="text-green-700" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Payment</p>
            <p className="text-2xl font-bold">{stats.payment}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Mail size={20} className="text-blue-700" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Email</p>
            <p className="text-2xl font-bold">{stats.email}</p>
          </div>
        </div>
      </div>

      {/* Quick Connect Cards */}
      <div className="mb-6">
        <h3 className="font-medium text-lg mb-4">Quick Connect</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Stripe', type: 'payment', color: '#635BFF', letter: 'S' },
            { name: 'SendGrid', type: 'email', color: '#1A82E2', letter: 'SG' },
            { name: 'ShipStation', type: 'shipping', color: '#1AB394', letter: 'SS' },
            { name: 'Google Analytics', type: 'analytics', color: '#F9AB00', letter: 'GA' }
          ].map((item) => {
            const isConnected = integrations.some(i => i.provider === item.name && i.status === 'active');
            return (
              <div 
                key={item.name}
                className="crm-card p-4 hover:border-crm-green transition-colors cursor-pointer"
                onClick={() => {
                  setFormData({
                    ...formData,
                    integration_type: item.type,
                    provider: item.name,
                    name: `${item.name} Integration`
                  });
                  setIsModalOpen(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: item.color }}
                  >
                    <span className="text-white font-bold text-sm">{item.letter}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-crm-text-secondary capitalize">{item.type}</p>
                  </div>
                  {isConnected ? (
                    <Check size={18} className="text-crm-green" />
                  ) : (
                    <ExternalLink size={16} className="text-crm-text-secondary" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connected Integrations */}
      <div className="crm-card" data-testid="integrations-list">
        <div className="p-6 border-b border-crm-border">
          <h3 className="font-medium text-lg">Connected Integrations</h3>
        </div>
        {integrations.length === 0 ? (
          <div className="p-12 text-center">
            <Monitor size={48} className="mx-auto mb-4 text-crm-text-secondary opacity-30" />
            <p className="text-crm-text-secondary mb-4">No integrations connected yet</p>
            <Button onClick={handleOpenModal} className="btn-primary">
              <Plus size={16} className="mr-2" /> Add Your First Integration
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-crm-border">
            {integrations.map((integration) => {
              const IconComponent = integrationIcons[integration.integration_type] || Monitor;
              return (
                <div key={integration.id} className="p-4 flex items-center gap-4" data-testid={`integration-${integration.id}`}>
                  <div className={`p-3 rounded-xl ${getTypeColor(integration.integration_type)}`}>
                    <IconComponent size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm text-crm-text-secondary">
                      {integration.provider} • {integration.integration_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {integration.last_sync && (
                      <span className="text-xs text-crm-text-secondary">
                        Last sync: {new Date(integration.last_sync).toLocaleDateString()}
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      integration.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {integration.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestIntegration(integration.id)}
                      disabled={testingId === integration.id}
                      className="btn-secondary"
                    >
                      {testingId === integration.id ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(integration)}
                      className={integration.status === 'active' ? 'text-crm-danger hover:bg-red-50' : 'text-crm-green hover:bg-green-50'}
                    >
                      {integration.status === 'active' ? <X size={14} /> : <Check size={14} />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteIntegration(integration.id)}
                      className="text-crm-danger hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Integration</DialogTitle>
            <DialogDescription>Connect a third-party service to your CRM.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="label-uppercase">Type *</Label>
                <Select 
                  value={formData.integration_type} 
                  onValueChange={(v) => setFormData({...formData, integration_type: v, provider: ''})}
                >
                  <SelectTrigger data-testid="integration-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {integrationTypes.map(type => (
                      <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Provider *</Label>
                <Select value={formData.provider} onValueChange={(v) => setFormData({...formData, provider: v})}>
                  <SelectTrigger data-testid="integration-provider-select">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {integrationProviders[formData.integration_type]?.map(provider => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="label-uppercase">Integration Name</Label>
              <Input
                data-testid="integration-name-input"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder={`${formData.provider || 'Service'} Integration`}
              />
            </div>
            <div className="space-y-2">
              <Label className="label-uppercase">API Key</Label>
              <Input
                data-testid="integration-apikey-input"
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                placeholder="Enter your API key"
              />
              <p className="text-xs text-crm-text-secondary">Your API key is encrypted and stored securely.</p>
            </div>
            <div className="space-y-2">
              <Label className="label-uppercase">Webhook URL (Optional)</Label>
              <Input
                data-testid="integration-webhook-input"
                value={formData.webhook_url}
                onChange={(e) => setFormData({...formData, webhook_url: e.target.value})}
                placeholder="https://your-webhook-url.com/hook"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" data-testid="integration-submit-btn" className="flex-1 btn-primary" disabled={!formData.provider}>
                Connect Integration
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Integrations;
