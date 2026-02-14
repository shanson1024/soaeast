import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  ArrowLeft, Mail, Phone, Building, MapPin, DollarSign, Package, 
  Calendar, Clock, Plus, Trash2, MessageSquare, PhoneCall, Users, FileText, CheckCircle,
  Pencil, Globe, User, Briefcase
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const noteTypeIcons = {
  general: MessageSquare,
  call: PhoneCall,
  meeting: Users,
  email: Mail,
  task: CheckCircle
};

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [deals, setDeals] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState({ content: '', note_type: 'general' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({});

  const noteTypes = ['general', 'call', 'meeting', 'email', 'task'];
  const industries = ['Healthcare', 'Technology', 'Real Estate', 'Fitness', 'Food & Beverage', 'Consulting', 'Education', 'Insurance', 'Services', 'Automotive', 'Manufacturing', 'Retail', 'Finance'];
  const tiers = ['gold', 'silver', 'bronze', 'new'];
  const statuses = ['active', 'inactive', 'lead'];

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    try {
      const [clientRes, ordersRes, dealsRes, notesRes] = await Promise.all([
        axios.get(`${API}/clients/${id}`),
        axios.get(`${API}/clients/${id}/orders`),
        axios.get(`${API}/clients/${id}/deals`),
        axios.get(`${API}/clients/${id}/notes`)
      ]);
      setClient(clientRes.data);
      setOrders(ordersRes.data);
      setDeals(dealsRes.data);
      setNotes(notesRes.data);
    } catch (error) {
      toast.error('Failed to fetch client data');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    setEditData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      industry: client.industry || '',
      tier: client.tier || 'new',
      status: client.status || 'active',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      zip_code: client.zip_code || '',
      contact_person: client.contact_person || '',
      contact_title: client.contact_title || '',
      website: client.website || '',
      notes: client.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/clients/${id}`, editData);
      toast.success('Client updated successfully');
      setIsEditModalOpen(false);
      fetchClientData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update client');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.content.trim()) return;
    
    try {
      await axios.post(`${API}/clients/${id}/notes`, newNote);
      toast.success('Note added');
      setNewNote({ content: '', note_type: 'general' });
      const notesRes = await axios.get(`${API}/clients/${id}/notes`);
      setNotes(notesRes.data);
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`${API}/clients/${id}/notes/${noteId}`);
      toast.success('Note deleted');
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-600',
      lead: 'bg-blue-100 text-blue-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const getTierBadge = (tier) => {
    const colors = {
      enterprise: 'bg-purple-100 text-purple-700',
      premium: 'bg-amber-100 text-amber-700',
      standard: 'bg-blue-100 text-blue-700',
      starter: 'bg-gray-100 text-gray-600'
    };
    return colors[tier] || 'bg-gray-100 text-gray-600';
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-600',
      production: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const getDealStageColor = (stage) => {
    const colors = {
      prospecting: 'bg-blue-100 text-blue-700',
      proposal: 'bg-amber-100 text-amber-700',
      negotiation: 'bg-purple-100 text-purple-700',
      won: 'bg-green-100 text-green-700',
      lost: 'bg-red-100 text-red-700'
    };
    return colors[stage] || 'bg-gray-100 text-gray-600';
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

  if (!client) return null;

  return (
    <Layout>
      <TopBar
        breadcrumb="Customers > Client List > Details"
        title=""
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenEditModal} className="btn-secondary" data-testid="edit-client-btn">
              <Pencil size={16} className="mr-2" /> Edit Client
            </Button>
            <Button variant="outline" onClick={() => navigate('/clients')} className="btn-secondary">
              <ArrowLeft size={16} className="mr-2" /> Back to Clients
            </Button>
          </div>
        }
      />

      {/* Edit Client Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateClient} className="space-y-6 mt-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-crm-text-secondary">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="label-uppercase">Company Name *</Label>
                  <Input
                    data-testid="edit-client-name"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="label-uppercase">Email *</Label>
                  <Input
                    data-testid="edit-client-email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="label-uppercase">Phone</Label>
                  <Input
                    data-testid="edit-client-phone"
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="label-uppercase">Website</Label>
                  <Input
                    data-testid="edit-client-website"
                    value={editData.website}
                    onChange={(e) => setEditData({...editData, website: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* Contact Person */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-crm-text-secondary">Primary Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="label-uppercase">Contact Name</Label>
                  <Input
                    data-testid="edit-contact-person"
                    value={editData.contact_person}
                    onChange={(e) => setEditData({...editData, contact_person: e.target.value})}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="label-uppercase">Title / Position</Label>
                  <Input
                    data-testid="edit-contact-title"
                    value={editData.contact_title}
                    onChange={(e) => setEditData({...editData, contact_title: e.target.value})}
                    placeholder="Purchasing Manager"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-crm-text-secondary">Address</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="label-uppercase">Street Address</Label>
                  <Input
                    data-testid="edit-client-address"
                    value={editData.address}
                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="label-uppercase">City</Label>
                    <Input
                      data-testid="edit-client-city"
                      value={editData.city}
                      onChange={(e) => setEditData({...editData, city: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-uppercase">State</Label>
                    <Input
                      data-testid="edit-client-state"
                      value={editData.state}
                      onChange={(e) => setEditData({...editData, state: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-uppercase">Zip Code</Label>
                    <Input
                      data-testid="edit-client-zip"
                      value={editData.zip_code}
                      onChange={(e) => setEditData({...editData, zip_code: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Classification */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-crm-text-secondary">Classification</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="label-uppercase">Industry</Label>
                  <Select value={editData.industry} onValueChange={(v) => setEditData({...editData, industry: v})}>
                    <SelectTrigger data-testid="edit-client-industry">
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
                  <Select value={editData.tier} onValueChange={(v) => setEditData({...editData, tier: v})}>
                    <SelectTrigger data-testid="edit-client-tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map(t => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="label-uppercase">Status</Label>
                  <Select value={editData.status} onValueChange={(v) => setEditData({...editData, status: v})}>
                    <SelectTrigger data-testid="edit-client-status">
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
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="label-uppercase">Internal Notes</Label>
              <textarea
                data-testid="edit-client-notes"
                className="flex min-h-[80px] w-full rounded-md border border-crm-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editData.notes}
                onChange={(e) => setEditData({...editData, notes: e.target.value})}
                placeholder="Additional notes about this client..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 btn-primary" data-testid="save-client-btn">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Client Header */}
      <div className="crm-card p-6 mb-6" data-testid="client-header">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 bg-crm-green-light rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-crm-green font-bold text-xl">
              {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{client.name}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(client.status)}`}>
                {client.status}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getTierBadge(client.tier)}`}>
                {client.tier}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-crm-text-secondary">
              <span className="flex items-center gap-1">
                <Mail size={14} /> {client.email}
              </span>
              {client.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={14} /> {client.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Building size={14} /> {client.industry}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-crm-green">{formatCurrency(client.total_revenue || 0)}</p>
              <p className="text-xs text-crm-text-secondary">Total Revenue</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{client.total_orders || 0}</p>
              <p className="text-xs text-crm-text-secondary">Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{deals.length}</p>
              <p className="text-xs text-crm-text-secondary">Deals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-crm-bg border border-crm-border mb-6">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white">Overview</TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-white">
            Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="deals" className="data-[state=active]:bg-white">
            Deals ({deals.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-white">
            Activity ({notes.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="crm-card p-6">
              <h3 className="font-medium text-lg mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-crm-text-secondary" />
                  <div>
                    <p className="text-xs text-crm-text-secondary">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-crm-text-secondary" />
                    <div>
                      <p className="text-xs text-crm-text-secondary">Phone</p>
                      <p className="font-medium">{client.phone}</p>
                    </div>
                  </div>
                )}
                {client.website && (
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-crm-text-secondary" />
                    <div>
                      <p className="text-xs text-crm-text-secondary">Website</p>
                      <a href={client.website} target="_blank" rel="noopener noreferrer" className="font-medium text-crm-green hover:underline">
                        {client.website}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Building size={18} className="text-crm-text-secondary" />
                  <div>
                    <p className="text-xs text-crm-text-secondary">Industry</p>
                    <p className="font-medium">{client.industry}</p>
                  </div>
                </div>
                {(client.address || client.city || client.state) && (
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-crm-text-secondary" />
                    <div>
                      <p className="text-xs text-crm-text-secondary">Address</p>
                      <p className="font-medium">
                        {client.address && <span>{client.address}<br /></span>}
                        {client.city && <span>{client.city}, </span>}
                        {client.state && <span>{client.state} </span>}
                        {client.zip_code && <span>{client.zip_code}</span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Contact Card */}
            <div className="space-y-6">
              {(client.contact_person || client.contact_title) && (
                <div className="crm-card p-6">
                  <h3 className="font-medium text-lg mb-4">Primary Contact</h3>
                  <div className="space-y-4">
                    {client.contact_person && (
                      <div className="flex items-center gap-3">
                        <User size={18} className="text-crm-text-secondary" />
                        <div>
                          <p className="text-xs text-crm-text-secondary">Name</p>
                          <p className="font-medium">{client.contact_person}</p>
                        </div>
                      </div>
                    )}
                    {client.contact_title && (
                      <div className="flex items-center gap-3">
                        <Briefcase size={18} className="text-crm-text-secondary" />
                        <div>
                          <p className="text-xs text-crm-text-secondary">Title</p>
                          <p className="font-medium">{client.contact_title}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="crm-card p-6">
                <h3 className="font-medium text-lg mb-4">Account Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign size={18} className="text-crm-green" />
                    <div>
                      <p className="text-xs text-crm-text-secondary">Total Revenue</p>
                      <p className="font-medium text-lg">{formatCurrency(client.total_revenue || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package size={18} className="text-crm-blue" />
                    <div>
                      <p className="text-xs text-crm-text-secondary">Total Orders</p>
                      <p className="font-medium text-lg">{client.total_orders || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-crm-purple" />
                    <div>
                      <p className="text-xs text-crm-text-secondary">Last Order</p>
                      <p className="font-medium">{formatDate(client.last_order_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-crm-warning" />
                    <div>
                      <p className="text-xs text-crm-text-secondary">Client Since</p>
                      <p className="font-medium">{formatDate(client.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            {client.notes && (
              <div className="crm-card p-6 lg:col-span-2">
                <h3 className="font-medium text-lg mb-4">Internal Notes</h3>
                <p className="text-crm-text-secondary whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <div className="crm-card overflow-hidden" data-testid="client-orders">
            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <Package size={48} className="mx-auto mb-4 text-crm-text-secondary opacity-30" />
                <p className="text-crm-text-secondary">No orders yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Items / Description</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} data-testid={`order-row-${order.id}`}>
                        <td className="font-mono font-medium">{order.order_id}</td>
                        <td>
                          <div className="max-w-xs">
                            {order.line_items && order.line_items.length > 0 ? (
                              order.line_items.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  {item.product_name} x{item.quantity} @ {formatCurrency(item.unit_price)}
                                </div>
                              ))
                            ) : order.products_description ? (
                              <div className="text-sm">{order.products_description}</div>
                            ) : (
                              <span className="text-crm-text-secondary text-sm">-</span>
                            )}
                          </div>
                        </td>
                        <td className="font-medium">
                          {formatCurrency(order.total > 0 ? order.total : (order.amount || 0))}
                        </td>
                        <td>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getOrderStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{formatDate(order.due_date)}</td>
                        <td className="text-crm-text-secondary">{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals">
          <div className="crm-card overflow-hidden" data-testid="client-deals">
            {deals.length === 0 ? (
              <div className="p-12 text-center">
                <FileText size={48} className="mx-auto mb-4 text-crm-text-secondary opacity-30" />
                <p className="text-crm-text-secondary">No deals in pipeline</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Amount</th>
                      <th>Stage</th>
                      <th>Priority</th>
                      <th>Owner</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((deal) => (
                      <tr key={deal.id} data-testid={`deal-row-${deal.id}`}>
                        <td className="font-medium">{deal.product_description}</td>
                        <td className="font-medium">{formatCurrency(deal.amount)}</td>
                        <td>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getDealStageColor(deal.stage)}`}>
                            {deal.stage}
                          </span>
                        </td>
                        <td className="capitalize">{deal.priority}</td>
                        <td>
                          <div className="w-8 h-8 bg-crm-green-light rounded-full flex items-center justify-center">
                            <span className="text-crm-green text-xs font-medium">{deal.owner_initials}</span>
                          </div>
                        </td>
                        <td className="text-crm-text-secondary">{formatDate(deal.date_entered)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Add Note Form */}
            <div className="crm-card p-6" data-testid="add-note-form">
              <h3 className="font-medium text-lg mb-4">Add Note</h3>
              <form onSubmit={handleAddNote} className="space-y-4">
                <div className="space-y-2">
                  <Label className="label-uppercase">Type</Label>
                  <Select value={newNote.note_type} onValueChange={(v) => setNewNote({...newNote, note_type: v})}>
                    <SelectTrigger data-testid="note-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {noteTypes.map(type => (
                        <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="label-uppercase">Note</Label>
                  <textarea
                    data-testid="note-content-input"
                    className="flex min-h-[100px] w-full rounded-md border border-crm-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    placeholder="Enter note..."
                    required
                  />
                </div>
                <Button type="submit" className="w-full btn-primary" data-testid="add-note-btn">
                  <Plus size={16} className="mr-2" /> Add Note
                </Button>
              </form>
            </div>

            {/* Activity Timeline */}
            <div className="lg:col-span-2 crm-card p-6" data-testid="activity-timeline">
              <h3 className="font-medium text-lg mb-4">Activity Log</h3>
              {notes.length === 0 ? (
                <div className="text-center py-8 text-crm-text-secondary">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No activity yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => {
                    const IconComponent = noteTypeIcons[note.note_type] || MessageSquare;
                    return (
                      <div key={note.id} className="flex gap-4 p-4 bg-crm-bg rounded-xl" data-testid={`note-${note.id}`}>
                        <div className="p-2 bg-white rounded-lg h-fit">
                          <IconComponent size={16} className="text-crm-green" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{note.created_by_name}</span>
                            <span className="text-xs px-2 py-0.5 bg-crm-green-light text-crm-green rounded capitalize">
                              {note.note_type}
                            </span>
                          </div>
                          <p className="text-sm text-crm-text-primary mb-2">{note.content}</p>
                          <p className="text-xs text-crm-text-secondary">{formatDate(note.created_at)}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors h-fit"
                        >
                          <Trash2 size={14} className="text-crm-danger" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default ClientDetail;
