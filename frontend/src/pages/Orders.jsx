import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { Plus, ClipboardList, Pencil, Package, Filter, ArrowUpDown, Download, Trash2, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [newOrder, setNewOrder] = useState({
    client_id: '',
    line_items: [{ product_name: '', quantity: 1, unit_price: 0 }],
    status: 'draft',
    priority: 'medium',
    due_date: '',
    notes: ''
  });

  const statuses = ['draft', 'production', 'shipped', 'delivered', 'cancelled'];
  const priorities = ['high', 'medium', 'low'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter, priorityFilter, sortOrder]);

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
        o.line_items?.some(item => item.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.client_name && o.client_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(o => o.priority === priorityFilter);
    }

    // Apply sorting
    if (sortOrder === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortOrder === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortOrder === 'amount-high') {
      filtered.sort((a, b) => (b.total || 0) - (a.total || 0));
    } else if (sortOrder === 'amount-low') {
      filtered.sort((a, b) => (a.total || 0) - (b.total || 0));
    } else if (sortOrder === 'due-soon') {
      filtered.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    }
    
    setFilteredOrders(filtered);
  };

  const handleExportOrders = async () => {
    try {
      const response = await axios.get(`${API}/export/orders`);
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${response.data.count} orders exported successfully`);
    } catch (error) {
      toast.error('Failed to export orders');
    }
  };

  const resetForm = () => {
    setNewOrder({
      client_id: '',
      line_items: [{ product_name: '', quantity: 1, unit_price: 0 }],
      status: 'draft',
      priority: 'medium',
      due_date: '',
      notes: ''
    });
    setEditingOrder(null);
  };

  const handleOpenModal = (order = null) => {
    if (order) {
      setEditingOrder(order);
      setNewOrder({
        client_id: order.client_id,
        line_items: order.line_items || [{ product_name: '', quantity: 1, unit_price: 0 }],
        status: order.status,
        priority: order.priority,
        due_date: order.due_date,
        notes: order.notes || ''
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

  const handleAddLineItem = () => {
    setNewOrder({
      ...newOrder,
      line_items: [...newOrder.line_items, { product_name: '', quantity: 1, unit_price: 0 }]
    });
  };

  const handleRemoveLineItem = (index) => {
    if (newOrder.line_items.length > 1) {
      setNewOrder({
        ...newOrder,
        line_items: newOrder.line_items.filter((_, i) => i !== index)
      });
    }
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = [...newOrder.line_items];
    updated[index] = { ...updated[index], [field]: value };
    setNewOrder({ ...newOrder, line_items: updated });
  };

  const calculateSubtotal = () => {
    return newOrder.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      if (editingOrder) {
        await axios.put(`${API}/orders/${editingOrder.id}`, newOrder);
        toast.success('Order updated successfully');
      } else {
        await axios.post(`${API}/orders`, newOrder);
        toast.success('Order created successfully');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save order');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API}/orders/${orderId}`, { status: newStatus });
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await axios.delete(`${API}/orders/${orderId}`);
      toast.success('Order deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'text-gray-600 bg-gray-100',
      production: 'text-blue-600 bg-blue-100',
      shipped: 'text-purple-600 bg-purple-100',
      delivered: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-amber-600',
      low: 'text-gray-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const stats = {
    total: orders.length,
    open: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalValue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
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
        title="Orders"
        onSearch={setSearchQuery}
        searchPlaceholder="Search orders..."
        actions={
          <Button data-testid="new-order-btn" className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} className="mr-2" /> New Order
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="order-stats">
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-crm-green-light rounded-xl">
            <ClipboardList size={20} className="text-crm-green" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Total Orders</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Package size={20} className="text-crm-blue" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Open Orders</p>
            <p className="text-2xl font-bold">{stats.open}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <Package size={20} className="text-green-600" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Delivered</p>
            <p className="text-2xl font-bold">{stats.delivered}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <ClipboardList size={20} className="text-crm-purple" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Total Value</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', ...statuses].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
              statusFilter === status 
                ? 'bg-crm-green text-white' 
                : 'bg-crm-bg hover:bg-crm-hover'
            }`}
          >
            {status === 'all' ? 'All' : status} ({status === 'all' ? orders.length : orders.filter(o => o.status === status).length})
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="crm-card overflow-hidden" data-testid="orders-table">
        <div className="p-4 border-b border-crm-border flex items-center justify-between">
          <p className="text-sm text-crm-text-secondary">{filteredOrders.length} results</p>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="btn-secondary text-sm" data-testid="orders-filter-btn">
                  <Filter size={14} className="mr-2" /> Filter {priorityFilter !== 'all' && `(${priorityFilter})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-2">Filter by Priority</p>
                  {['all', 'high', 'medium', 'low'].map(priority => (
                    <button
                      key={priority}
                      onClick={() => setPriorityFilter(priority)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                        priorityFilter === priority ? 'bg-crm-green-light text-crm-green' : 'hover:bg-crm-bg'
                      }`}
                    >
                      {priority === 'all' ? 'All Priorities' : priority}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="btn-secondary text-sm" data-testid="orders-sort-btn">
                  <ArrowUpDown size={14} className="mr-2" /> Sort
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-2">Sort Orders</p>
                  {[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'oldest', label: 'Oldest First' },
                    { value: 'amount-high', label: 'Amount: High to Low' },
                    { value: 'amount-low', label: 'Amount: Low to High' },
                    { value: 'due-soon', label: 'Due Date: Soonest' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortOrder(option.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        sortOrder === option.value ? 'bg-crm-green-light text-crm-green' : 'hover:bg-crm-bg'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" className="btn-secondary text-sm" onClick={handleExportOrders} data-testid="orders-export-btn">
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
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr 
                    className="cursor-pointer hover:bg-crm-bg/50"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    data-testid={`order-row-${order.id}`}
                  >
                    <td className="font-mono font-medium">{order.order_id}</td>
                    <td>{order.client_name || 'Unknown'}</td>
                    <td>
                      <span className="text-sm">
                        {order.line_items?.length || 0} item{(order.line_items?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="font-medium">{formatCurrency(order.total)}</td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="w-32">
                      <div className="flex items-center gap-2">
                        <Progress value={order.progress_percent} className="h-1.5 flex-1" />
                        <span className="text-xs text-crm-text-secondary">{order.progress_percent}%</span>
                      </div>
                    </td>
                    <td className="text-crm-text-secondary">
                      {new Date(order.due_date).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`font-medium capitalize ${getPriorityColor(order.priority)}`}>
                        {order.priority}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenModal(order); }}
                          className="p-2 hover:bg-crm-hover rounded-lg transition-colors"
                        >
                          <Pencil size={14} className="text-crm-text-secondary" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} className="text-crm-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Row - Line Items Detail */}
                  {expandedOrder === order.id && (
                    <tr>
                      <td colSpan={9} className="bg-crm-bg/50 p-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Line Items */}
                          <div>
                            <h4 className="font-medium mb-3">Order Items</h4>
                            <div className="bg-white rounded-lg border border-crm-border overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-crm-bg">
                                  <tr>
                                    <th className="text-left px-4 py-2">Product</th>
                                    <th className="text-center px-4 py-2">Qty</th>
                                    <th className="text-right px-4 py-2">Unit Price</th>
                                    <th className="text-right px-4 py-2">Line Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.line_items?.map((item, idx) => (
                                    <tr key={idx} className="border-t border-crm-border">
                                      <td className="px-4 py-3">{item.product_name}</td>
                                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                                      <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                                      <td className="px-4 py-3 text-right font-medium">
                                        {formatCurrency(item.quantity * item.unit_price)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          {/* Order Summary */}
                          <div>
                            <h4 className="font-medium mb-3">Order Summary</h4>
                            <div className="bg-white rounded-lg border border-crm-border p-4 space-y-3">
                              <div className="flex justify-between">
                                <span className="text-crm-text-secondary">Subtotal</span>
                                <span>{formatCurrency(order.subtotal)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-crm-text-secondary">Tax ({order.tax_rate}%)</span>
                                <span>{formatCurrency(order.tax_amount)}</span>
                              </div>
                              <div className="border-t border-crm-border pt-3 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span className="text-crm-green">{formatCurrency(order.total)}</span>
                              </div>
                              {order.notes && (
                                <div className="pt-3 border-t border-crm-border">
                                  <p className="text-xs text-crm-text-secondary mb-1">Notes</p>
                                  <p className="text-sm">{order.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-crm-text-secondary">
            No orders found
          </div>
        )}
      </div>

      {/* Create/Edit Order Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'Edit Order' : 'Create New Order'}</DialogTitle>
            <DialogDescription>
              {editingOrder ? 'Update order details below.' : 'Add order details and line items below.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrder} className="space-y-6 mt-4">
            {/* Client & Details */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="label-uppercase">Client *</Label>
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
                <Label className="label-uppercase">Due Date *</Label>
                <Input
                  data-testid="order-due-date"
                  type="date"
                  value={newOrder.due_date}
                  onChange={(e) => setNewOrder({...newOrder, due_date: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="label-uppercase">Status</Label>
                <Select value={newOrder.status} onValueChange={(v) => setNewOrder({...newOrder, status: v})}>
                  <SelectTrigger data-testid="order-status-select">
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

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="label-uppercase">Line Items *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem} data-testid="add-line-item-btn">
                  <Plus size={14} className="mr-1" /> Add Item
                </Button>
              </div>
              <div className="space-y-3">
                {newOrder.line_items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start p-3 bg-crm-bg rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input
                        data-testid={`line-item-name-${index}`}
                        placeholder="Product name"
                        value={item.product_name}
                        onChange={(e) => handleLineItemChange(index, 'product_name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-20 space-y-2">
                      <Input
                        data-testid={`line-item-qty-${index}`}
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                    <div className="w-28 space-y-2">
                      <Input
                        data-testid={`line-item-price-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Unit price"
                        value={item.unit_price}
                        onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="w-24 text-right pt-2 font-medium">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </div>
                    {newOrder.line_items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(index)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={16} className="text-crm-danger" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t border-crm-border">
                <div className="text-right">
                  <p className="text-sm text-crm-text-secondary">Subtotal</p>
                  <p className="text-xl font-bold">{formatCurrency(calculateSubtotal())}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="label-uppercase">Notes</Label>
              <textarea
                data-testid="order-notes"
                className="flex min-h-[80px] w-full rounded-md border border-crm-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newOrder.notes}
                onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 btn-primary" data-testid="submit-order-btn">
                {editingOrder ? 'Update Order' : 'Create Order'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Orders;
