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
import { toast } from 'sonner';
import { 
  ArrowLeft, Mail, Phone, Building, MapPin, DollarSign, Package, 
  Calendar, Clock, Plus, Trash2, MessageSquare, PhoneCall, Users, FileText, CheckCircle
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

  const noteTypes = ['general', 'call', 'meeting', 'email', 'task'];

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
          <Button variant="outline" onClick={() => navigate('/clients')} className="btn-secondary">
            <ArrowLeft size={16} className="mr-2" /> Back to Clients
          </Button>
        }
      />

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
                <div className="flex items-center gap-3">
                  <Building size={18} className="text-crm-text-secondary" />
                  <div>
                    <p className="text-xs text-crm-text-secondary">Industry</p>
                    <p className="font-medium">{client.industry}</p>
                  </div>
                </div>
                {client.address && (
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-crm-text-secondary" />
                    <div>
                      <p className="text-xs text-crm-text-secondary">Address</p>
                      <p className="font-medium">{client.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
                      <th>Items</th>
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
                            {order.line_items?.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                {item.product_name} x{item.quantity} @ {formatCurrency(item.unit_price)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="font-medium">{formatCurrency(order.total || 0)}</td>
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
