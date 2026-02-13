import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { Plus, ClipboardList, Pencil, Settings, Package, CheckCircle, Filter, ArrowUpDown, Download } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    client_id: '', products_description: '', amount: '', status: 'draft', priority: 'medium', due_date: ''
  });

  const statuses = ['draft', 'production', 'shipped', 'delivered', 'cancelled'];
  const priorities = ['high', 'medium', 'low'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const fetchData = async () => {
    try {
      const [ordersRes, clientsRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/clients`)
      ]);
      setOrders(ordersRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];
    
    if (searchQuery) {
      filtered = filtered.filter(o =>
        o.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.products_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.client_name && o.client_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }
    
    setFilteredOrders(filtered);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        ...newOrder,
        amount: parseFloat(newOrder.amount),
        progress_percent: 0
      };
      await axios.post(`${API}/orders`, orderData);
      toast.success('Order created successfully');
      setIsModalOpen(false);
      setNewOrder({ client_id: '', products_description: '', amount: '', status: 'draft', priority: 'medium', due_date: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: Pencil,
      production: Settings,
      shipped: Package,
      delivered: CheckCircle,
      cancelled: ClipboardList
    };
    return icons[status] || ClipboardList;
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      production: 'bg-blue-100 text-blue-700',
      shipped: 'bg-crm-green-light text-crm-green',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority) => {
    const colors = { high: 'bg-crm-danger', medium: 'bg-crm-warning', low: 'bg-crm-green' };
    return colors[priority] || 'bg-gray-400';
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'delivered' || status === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  const statusCounts = {
    all: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length,
    draft: orders.filter(o => o.status === 'draft').length,
    production: orders.filter(o => o.status === 'production').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length
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
        breadcrumb="Main Menu > Orders"
        title="Order Management"
        onSearch={setSearchQuery}
        searchPlaceholder="Search orders..."
        actions={
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button data-testid="new-order-btn" className="btn-primary">
                <Plus size={16} className="mr-2" /> New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>Create a new order for a client with product details.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrder} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="label-uppercase">Client</Label>
                  <Select value={newOrder.client_id} onValueChange={(v) => setNewOrder({...newOrder, client_id: v})}>
                    <SelectTrigger data-testid="order-client-select">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="label-uppercase">Products Description</Label>
                  <Input
                    data-testid="order-products-input"
                    value={newOrder.products_description}
                    onChange={(e) => setNewOrder({...newOrder, products_description: e.target.value})}
                    placeholder="e.g., 100x Polo Shirts"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="label-uppercase">Amount ($)</Label>
                    <Input
                      data-testid="order-amount-input"
                      type="number"
                      step="0.01"
                      value={newOrder.amount}
                      onChange={(e) => setNewOrder({...newOrder, amount: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-uppercase">Priority</Label>
                    <Select value={newOrder.priority} onValueChange={(v) => setNewOrder({...newOrder, priority: v})}>
                      <SelectTrigger data-testid="order-priority-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(p => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="label-uppercase">Due Date</Label>
                  <Input
                    data-testid="order-due-date-input"
                    type="date"
                    value={newOrder.due_date}
                    onChange={(e) => setNewOrder({...newOrder, due_date: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" data-testid="order-submit-btn" className="w-full btn-primary">
                  Create Order
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6" data-testid="order-status-cards">
        {[
          { key: 'all', label: 'All Open', icon: ClipboardList, color: 'text-crm-text-primary' },
          { key: 'draft', label: 'Draft', icon: Pencil, color: 'text-gray-500' },
          { key: 'production', label: 'In Production', icon: Settings, color: 'text-crm-blue' },
          { key: 'shipped', label: 'Shipped', icon: Package, color: 'text-crm-green' },
          { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-green-600' }
        ].map(item => (
          <button
            key={item.key}
            data-testid={`status-card-${item.key}`}
            onClick={() => setStatusFilter(item.key)}
            className={`crm-card p-4 text-left transition-all ${statusFilter === item.key ? 'ring-2 ring-crm-green' : ''}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <item.icon size={18} className={item.color} />
              <span className="text-2xl font-bold">{statusCounts[item.key]}</span>
            </div>
            <p className="text-sm text-crm-text-secondary">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="crm-card overflow-hidden" data-testid="orders-table">
        <div className="p-4 border-b border-crm-border flex items-center justify-between">
          <p className="text-sm text-crm-text-secondary">{filteredOrders.length} results</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="btn-secondary text-sm">
              <Filter size={14} className="mr-2" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="btn-secondary text-sm">
              <ArrowUpDown size={14} className="mr-2" /> Sort
            </Button>
            <Button variant="outline" size="sm" className="btn-secondary text-sm">
              <Download size={14} className="mr-2" /> Export
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Client</th>
                <th>Products</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Due Date</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <tr key={order.id}>
                    <td>
                      <span className="font-mono text-crm-green font-medium">{order.order_id}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-crm-green-light rounded-full flex items-center justify-center">
                          <span className="text-crm-green text-xs font-medium">
                            {order.client_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                          </span>
                        </div>
                        <span className="font-medium">{order.client_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="text-crm-text-secondary max-w-[200px] truncate">{order.products_description}</td>
                    <td className="font-medium">{formatCurrency(order.amount)}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                        <StatusIcon size={12} />
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={order.progress_percent} className="h-1.5 flex-1" />
                        <span className="text-xs text-crm-text-secondary w-8">{order.progress_percent}%</span>
                      </div>
                    </td>
                    <td className={isOverdue(order.due_date, order.status) ? 'text-crm-danger font-medium' : 'text-crm-text-secondary'}>
                      {new Date(order.due_date).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`status-dot ${order.priority}`}></span>
                        <span className="capitalize text-sm">{order.priority}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-crm-text-secondary">
            No orders found
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
