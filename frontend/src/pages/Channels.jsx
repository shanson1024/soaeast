import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Globe, Store, ShoppingCart, Users, Building, Share2, DollarSign, Package, Pencil, Trash2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const channelIcons = {
  direct: Building,
  retail: Store,
  online: ShoppingCart,
  wholesale: Package,
  referral: Share2
};

const Channels = () => {
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    channel_type: 'direct',
    description: '',
    contact_email: '',
    commission_rate: 0,
    status: 'active'
  });

  const channelTypes = ['direct', 'retail', 'online', 'wholesale', 'referral'];
  const statuses = ['active', 'inactive', 'pending'];

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    filterChannels();
  }, [channels, searchQuery, activeTab]);

  const fetchChannels = async () => {
    try {
      const response = await axios.get(`${API}/channels`);
      setChannels(response.data);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterChannels = () => {
    let filtered = [...channels];
    
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(c => c.channel_type === activeTab);
    }
    
    setFilteredChannels(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      channel_type: 'direct',
      description: '',
      contact_email: '',
      commission_rate: 0,
      status: 'active'
    });
    setEditingChannel(null);
  };

  const handleOpenModal = (channel = null) => {
    if (channel) {
      setEditingChannel(channel);
      setFormData({
        name: channel.name,
        channel_type: channel.channel_type,
        description: channel.description || '',
        contact_email: channel.contact_email || '',
        commission_rate: channel.commission_rate,
        status: channel.status
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingChannel) {
        await axios.put(`${API}/channels/${editingChannel.id}`, formData);
        toast.success('Channel updated successfully');
      } else {
        await axios.post(`${API}/channels`, formData);
        toast.success('Channel created successfully');
      }
      handleCloseModal();
      fetchChannels();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save channel');
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (!window.confirm('Are you sure you want to delete this channel?')) return;
    try {
      await axios.delete(`${API}/channels/${channelId}`);
      toast.success('Channel deleted');
      fetchChannels();
    } catch (error) {
      toast.error('Failed to delete channel');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const stats = {
    total: channels.length,
    active: channels.filter(c => c.status === 'active').length,
    totalRevenue: channels.reduce((acc, c) => acc + (c.total_revenue || 0), 0),
    totalOrders: channels.reduce((acc, c) => acc + (c.total_orders || 0), 0)
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-600',
      pending: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const getTypeColor = (type) => {
    const colors = {
      direct: 'bg-crm-green-light text-crm-green',
      retail: 'bg-blue-100 text-crm-blue',
      online: 'bg-purple-100 text-crm-purple',
      wholesale: 'bg-amber-100 text-amber-700',
      referral: 'bg-pink-100 text-pink-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
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
        breadcrumb="Customers > Channels"
        title="Sales Channels"
        onSearch={setSearchQuery}
        searchPlaceholder="Search channels..."
        actions={
          <Button data-testid="add-channel-btn" className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} className="mr-2" /> Add Channel
          </Button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="channel-stats">
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-crm-green-light rounded-xl">
            <Globe size={20} className="text-crm-green" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Total Channels</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Users size={20} className="text-crm-blue" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Active Channels</p>
            <p className="text-2xl font-bold">{stats.active}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <DollarSign size={20} className="text-crm-purple" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Channel Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <Package size={20} className="text-crm-warning" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Total Orders</p>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-crm-bg border border-crm-border">
          <TabsTrigger data-testid="tab-all" value="all" className="data-[state=active]:bg-white">
            All ({channels.length})
          </TabsTrigger>
          {channelTypes.map(type => (
            <TabsTrigger 
              key={type} 
              data-testid={`tab-${type}`} 
              value={type} 
              className="data-[state=active]:bg-white capitalize"
            >
              {type} ({channels.filter(c => c.channel_type === type).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Channels Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="channels-grid">
        {filteredChannels.length === 0 ? (
          <div className="col-span-full crm-card p-12 text-center">
            <Globe size={48} className="mx-auto mb-4 text-crm-text-secondary opacity-30" />
            <p className="text-crm-text-secondary mb-4">
              {channels.length === 0 ? 'No sales channels yet' : 'No channels match your search'}
            </p>
            {channels.length === 0 && (
              <Button onClick={() => handleOpenModal()} className="btn-primary">
                <Plus size={16} className="mr-2" /> Add Your First Channel
              </Button>
            )}
          </div>
        ) : (
          filteredChannels.map((channel) => {
            const IconComponent = channelIcons[channel.channel_type] || Globe;
            return (
              <div key={channel.id} className="crm-card p-6" data-testid={`channel-card-${channel.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${getTypeColor(channel.channel_type)}`}>
                    <IconComponent size={24} />
                  </div>
                  <div className="flex gap-1">
                    <button
                      data-testid={`channel-edit-${channel.id}`}
                      onClick={() => handleOpenModal(channel)}
                      className="p-2 hover:bg-crm-hover rounded-lg transition-colors"
                    >
                      <Pencil size={14} className="text-crm-text-secondary" />
                    </button>
                    <button
                      data-testid={`channel-delete-${channel.id}`}
                      onClick={() => handleDeleteChannel(channel.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} className="text-crm-danger" />
                    </button>
                  </div>
                </div>
                <h3 className="font-medium text-lg mb-1">{channel.name}</h3>
                <p className="text-sm text-crm-text-secondary mb-4 line-clamp-2">{channel.description || 'No description'}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getTypeColor(channel.channel_type)}`}>
                    {channel.channel_type}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(channel.status)}`}>
                    {channel.status}
                  </span>
                </div>
                <div className="pt-3 border-t border-crm-border grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-crm-text-secondary">Revenue</p>
                    <p className="font-medium">{formatCurrency(channel.total_revenue || 0)}</p>
                  </div>
                  <div>
                    <p className="text-crm-text-secondary">Orders</p>
                    <p className="font-medium">{channel.total_orders || 0}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingChannel ? 'Edit Channel' : 'Add Sales Channel'}</DialogTitle>
            <DialogDescription>
              {editingChannel ? 'Update the channel details below.' : 'Create a new sales channel to track revenue streams.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="label-uppercase">Channel Name *</Label>
              <Input
                data-testid="channel-name-input"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Amazon Marketplace"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="label-uppercase">Type *</Label>
                <Select value={formData.channel_type} onValueChange={(v) => setFormData({...formData, channel_type: v})}>
                  <SelectTrigger data-testid="channel-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {channelTypes.map(type => (
                      <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger data-testid="channel-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="label-uppercase">Description</Label>
              <textarea
                data-testid="channel-description-input"
                className="flex min-h-[80px] w-full rounded-md border border-crm-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe this sales channel..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="label-uppercase">Contact Email</Label>
                <Input
                  data-testid="channel-email-input"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  placeholder="contact@channel.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Commission Rate (%)</Label>
                <Input
                  data-testid="channel-commission-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({...formData, commission_rate: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" data-testid="channel-submit-btn" className="flex-1 btn-primary">
                {editingChannel ? 'Update Channel' : 'Create Channel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Channels;
