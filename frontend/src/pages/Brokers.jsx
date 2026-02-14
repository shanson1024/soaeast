import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, MoreHorizontal, Users, DollarSign, Percent, MapPin, Pencil, Trash2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Brokers = () => {
  const [brokers, setBrokers] = useState([]);
  const [filteredBrokers, setFilteredBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    territory: '',
    commission_rate: 10,
    status: 'active',
    notes: ''
  });

  const territories = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West Coast', 'National'];
  const statuses = ['active', 'inactive', 'pending'];

  useEffect(() => {
    fetchBrokers();
  }, []);

  useEffect(() => {
    filterBrokers();
  }, [brokers, searchQuery, activeTab]);

  const fetchBrokers = async () => {
    try {
      const response = await axios.get(`${API}/brokers`);
      setBrokers(response.data);
    } catch (error) {
      toast.error('Failed to fetch brokers');
    } finally {
      setLoading(false);
    }
  };

  const filterBrokers = () => {
    let filtered = [...brokers];
    
    if (searchQuery) {
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(b => b.status === activeTab);
    }
    
    setFilteredBrokers(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      territory: '',
      commission_rate: 10,
      status: 'active',
      notes: ''
    });
    setEditingBroker(null);
  };

  const handleOpenModal = (broker = null) => {
    if (broker) {
      setEditingBroker(broker);
      setFormData({
        name: broker.name,
        company: broker.company,
        email: broker.email,
        phone: broker.phone || '',
        territory: broker.territory || '',
        commission_rate: broker.commission_rate,
        status: broker.status,
        notes: broker.notes || ''
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
      if (editingBroker) {
        await axios.put(`${API}/brokers/${editingBroker.id}`, formData);
        toast.success('Broker updated successfully');
      } else {
        await axios.post(`${API}/brokers`, formData);
        toast.success('Broker created successfully');
      }
      handleCloseModal();
      fetchBrokers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save broker');
    }
  };

  const handleDeleteBroker = async (brokerId) => {
    if (!window.confirm('Are you sure you want to delete this broker?')) return;
    try {
      await axios.delete(`${API}/brokers/${brokerId}`);
      toast.success('Broker deleted');
      fetchBrokers();
    } catch (error) {
      toast.error('Failed to delete broker');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const stats = {
    total: brokers.length,
    active: brokers.filter(b => b.status === 'active').length,
    totalSales: brokers.reduce((acc, b) => acc + (b.total_sales || 0), 0),
    avgCommission: brokers.length > 0 
      ? (brokers.reduce((acc, b) => acc + b.commission_rate, 0) / brokers.length).toFixed(1)
      : 0
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-600',
      pending: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
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
        breadcrumb="Partners > Brokers"
        title="Brokers"
        onSearch={setSearchQuery}
        searchPlaceholder="Search brokers..."
        actions={
          <Button data-testid="add-broker-btn" className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} className="mr-2" /> Add Broker
          </Button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="broker-stats">
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-crm-green-light rounded-xl">
            <Users size={20} className="text-crm-green" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Total Brokers</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Users size={20} className="text-crm-blue" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Active Brokers</p>
            <p className="text-2xl font-bold">{stats.active}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <DollarSign size={20} className="text-crm-purple" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Total Sales</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <Percent size={20} className="text-crm-warning" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Avg Commission</p>
            <p className="text-2xl font-bold">{stats.avgCommission}%</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-crm-bg border border-crm-border">
          <TabsTrigger data-testid="tab-all" value="all" className="data-[state=active]:bg-white">
            All Brokers ({brokers.length})
          </TabsTrigger>
          <TabsTrigger data-testid="tab-active" value="active" className="data-[state=active]:bg-white">
            Active ({brokers.filter(b => b.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger data-testid="tab-inactive" value="inactive" className="data-[state=active]:bg-white">
            Inactive ({brokers.filter(b => b.status === 'inactive').length})
          </TabsTrigger>
          <TabsTrigger data-testid="tab-pending" value="pending" className="data-[state=active]:bg-white">
            Pending ({brokers.filter(b => b.status === 'pending').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Brokers Table */}
      <div className="crm-card overflow-hidden" data-testid="brokers-table">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Broker</th>
                <th>Company</th>
                <th>Territory</th>
                <th>Commission</th>
                <th>Total Sales</th>
                <th>Deals</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredBrokers.map((broker) => (
                <tr key={broker.id} data-testid={`broker-row-${broker.id}`}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-crm-green-light rounded-full flex items-center justify-center">
                        <span className="text-crm-green font-medium text-sm">
                          {broker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{broker.name}</p>
                        <p className="text-xs text-crm-text-secondary">{broker.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{broker.company}</td>
                  <td>
                    {broker.territory ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin size={14} className="text-crm-text-secondary" />
                        {broker.territory}
                      </div>
                    ) : (
                      <span className="text-crm-text-secondary">-</span>
                    )}
                  </td>
                  <td className="font-medium">{broker.commission_rate}%</td>
                  <td className="font-medium">{formatCurrency(broker.total_sales || 0)}</td>
                  <td>{broker.total_deals || 0}</td>
                  <td>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(broker.status)}`}>
                      {broker.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        data-testid={`broker-edit-${broker.id}`}
                        onClick={() => handleOpenModal(broker)}
                        className="p-2 hover:bg-crm-hover rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} className="text-crm-text-secondary" />
                      </button>
                      <button
                        data-testid={`broker-delete-${broker.id}`}
                        onClick={() => handleDeleteBroker(broker.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} className="text-crm-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBrokers.length === 0 && (
          <div className="text-center py-12 text-crm-text-secondary">
            {brokers.length === 0 ? (
              <div>
                <p className="mb-2">No brokers yet</p>
                <Button onClick={() => handleOpenModal()} className="btn-primary">
                  <Plus size={16} className="mr-2" /> Add Your First Broker
                </Button>
              </div>
            ) : (
              'No brokers found'
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBroker ? 'Edit Broker' : 'Add New Broker'}</DialogTitle>
            <DialogDescription>
              {editingBroker ? 'Update the broker details below.' : 'Fill in the details below to add a new broker partner.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="label-uppercase">Name *</Label>
                <Input
                  data-testid="broker-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Company *</Label>
                <Input
                  data-testid="broker-company-input"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="Sales Partners Inc"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="label-uppercase">Email *</Label>
                <Input
                  data-testid="broker-email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Phone</Label>
                <Input
                  data-testid="broker-phone-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="label-uppercase">Territory</Label>
                <Select value={formData.territory} onValueChange={(v) => setFormData({...formData, territory: v})}>
                  <SelectTrigger data-testid="broker-territory-select">
                    <SelectValue placeholder="Select territory" />
                  </SelectTrigger>
                  <SelectContent>
                    {territories.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Commission Rate (%)</Label>
                <Input
                  data-testid="broker-commission-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({...formData, commission_rate: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="label-uppercase">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger data-testid="broker-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="label-uppercase">Notes</Label>
              <textarea
                data-testid="broker-notes-input"
                className="flex min-h-[80px] w-full rounded-md border border-crm-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes about this broker..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" data-testid="broker-submit-btn" className="flex-1 btn-primary">
                {editingBroker ? 'Update Broker' : 'Create Broker'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Brokers;
