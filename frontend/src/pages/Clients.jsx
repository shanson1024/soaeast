import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, MoreHorizontal, Users, DollarSign, RefreshCw, UserCheck } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '', email: '', industry: 'Technology', tier: 'new', status: 'active'
  });

  const industries = ['Healthcare', 'Technology', 'Real Estate', 'Fitness', 'Food & Beverage', 'Consulting', 'Education', 'Insurance', 'Services', 'Automotive'];
  const tiers = ['gold', 'silver', 'bronze', 'new'];

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchQuery, activeTab]);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`);
      setClients(response.data);
    } catch (error) {
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = [...clients];
    
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeTab === 'active') {
      filtered = filtered.filter(c => c.status === 'active');
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(c => c.status === 'inactive');
    } else if (activeTab === 'gold') {
      filtered = filtered.filter(c => c.tier === 'gold');
    }
    
    setFilteredClients(filtered);
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/clients`, newClient);
      toast.success('Client created successfully');
      setIsModalOpen(false);
      setNewClient({ name: '', email: '', industry: 'Technology', tier: 'new', status: 'active' });
      fetchClients();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create client');
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      await axios.delete(`${API}/clients/${clientId}`);
      toast.success('Client deleted');
      fetchClients();
    } catch (error) {
      toast.error('Failed to delete client');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    revenue: clients.reduce((acc, c) => acc + c.total_revenue, 0),
    avgReorder: 2.4
  };

  const getTierColor = (tier) => {
    const colors = { gold: 'bg-yellow-500', silver: 'bg-gray-400', bronze: 'bg-amber-600', new: 'bg-crm-green' };
    return colors[tier] || 'bg-gray-400';
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
        breadcrumb="Customers > Client List"
        title="Clients"
        onSearch={setSearchQuery}
        searchPlaceholder="Search clients..."
        actions={
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-client-btn" className="btn-primary">
                <Plus size={16} className="mr-2" /> Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="label-uppercase">Name</Label>
                  <Input
                    data-testid="client-name-input"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    placeholder="Company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="label-uppercase">Email</Label>
                  <Input
                    data-testid="client-email-input"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    placeholder="contact@company.com"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="label-uppercase">Industry</Label>
                    <Select value={newClient.industry} onValueChange={(v) => setNewClient({...newClient, industry: v})}>
                      <SelectTrigger data-testid="client-industry-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map(ind => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="label-uppercase">Tier</Label>
                    <Select value={newClient.tier} onValueChange={(v) => setNewClient({...newClient, tier: v})}>
                      <SelectTrigger data-testid="client-tier-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tiers.map(tier => (
                          <SelectItem key={tier} value={tier} className="capitalize">{tier}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" data-testid="client-submit-btn" className="w-full btn-primary">
                  Create Client
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="client-stats">
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-crm-green-light rounded-xl">
            <Users size={20} className="text-crm-green" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Total Clients</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <UserCheck size={20} className="text-crm-blue" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Active Clients</p>
            <p className="text-2xl font-bold">{stats.active} <span className="text-sm text-crm-text-secondary font-normal">({Math.round(stats.active/stats.total*100)}%)</span></p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <DollarSign size={20} className="text-crm-purple" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Lifetime Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.revenue)}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <RefreshCw size={20} className="text-crm-warning" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Avg Reorder Rate</p>
            <p className="text-2xl font-bold">{stats.avgReorder}x<span className="text-sm text-crm-text-secondary font-normal">/year</span></p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-crm-bg border border-crm-border">
          <TabsTrigger data-testid="tab-all" value="all" className="data-[state=active]:bg-white">
            All Clients ({clients.length})
          </TabsTrigger>
          <TabsTrigger data-testid="tab-active" value="active" className="data-[state=active]:bg-white">
            Active ({clients.filter(c => c.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger data-testid="tab-inactive" value="inactive" className="data-[state=active]:bg-white">
            Inactive ({clients.filter(c => c.status === 'inactive').length})
          </TabsTrigger>
          <TabsTrigger data-testid="tab-gold" value="gold" className="data-[state=active]:bg-white">
            Gold Tier ({clients.filter(c => c.tier === 'gold').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Client Table */}
      <div className="crm-card overflow-hidden" data-testid="clients-table">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Industry</th>
                <th>Tier</th>
                <th>Total Revenue</th>
                <th>Orders</th>
                <th>Last Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-crm-green-light rounded-full flex items-center justify-center">
                        <span className="text-crm-green font-medium text-sm">
                          {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-xs text-crm-text-secondary">{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="px-2.5 py-1 bg-crm-bg rounded-full text-xs font-medium">
                      {client.industry}
                    </span>
                  </td>
                  <td>
                    <div className="tier-badge">
                      <span className={`dot ${getTierColor(client.tier)}`}></span>
                      <span className="capitalize">{client.tier}</span>
                    </div>
                  </td>
                  <td className="font-medium">{formatCurrency(client.total_revenue)}</td>
                  <td>{client.total_orders}</td>
                  <td className="text-crm-text-secondary">
                    {client.last_order_date ? new Date(client.last_order_date).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <button
                      data-testid={`client-menu-${client.id}`}
                      onClick={() => handleDeleteClient(client.id)}
                      className="p-2 hover:bg-crm-hover rounded-lg transition-colors"
                    >
                      <MoreHorizontal size={16} className="text-crm-text-secondary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredClients.length === 0 && (
          <div className="text-center py-12 text-crm-text-secondary">
            No clients found
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Clients;
