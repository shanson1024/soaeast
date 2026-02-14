import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, FileText, Users, DollarSign, Filter, Download, Plus, Package, ClipboardList, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dealFilter, setDealFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [pipelineSummary, setPipelineSummary] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [recentDeals, setRecentDeals] = useState([]);
  const [clients, setClients] = useState([]);
  const [trendView, setTrendView] = useState('monthly');
  const [loading, setLoading] = useState(true);
  
  // Quick action modals
  const [quickDealOpen, setQuickDealOpen] = useState(false);
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({ client_name: '', amount: '', product_description: '', stage: 'prospecting', priority: 'medium', tags: [] });
  const [newOrder, setNewOrder] = useState({ client_id: '', products_description: '', amount: '', priority: 'medium', due_date: '' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, pipelineRes, trendRes, dealsRes, clientsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/dashboard/pipeline-summary`),
        axios.get(`${API}/dashboard/sales-trend`),
        axios.get(`${API}/dashboard/recent-deals`),
        axios.get(`${API}/clients`)
      ]);
      setStats(statsRes.data);
      setPipelineSummary(pipelineRes.data);
      setSalesTrend(trendRes.data);
      setRecentDeals(dealsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDeal = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/deals`, { ...newDeal, amount: parseFloat(newDeal.amount), owner_initials: user?.initials || 'SH', owner_color: '#2d6a4f' });
      toast.success('Deal created successfully!');
      setQuickDealOpen(false);
      setNewDeal({ client_name: '', amount: '', product_description: '', stage: 'prospecting', priority: 'medium', tags: [] });
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to create deal');
    }
  };

  const handleQuickOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/orders`, { ...newOrder, amount: parseFloat(newOrder.amount), status: 'draft', progress_percent: 0 });
      toast.success('Order created successfully!');
      setQuickOrderOpen(false);
      setNewOrder({ client_id: '', products_description: '', amount: '', priority: 'medium', due_date: '' });
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const KPICard = ({ title, value, change, isPositive, icon: Icon, delay }) => (
    <div className={`crm-card p-6 opacity-0 animate-fade-up animate-delay-${delay}`} data-testid={`kpi-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="label-uppercase mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-crm-text-primary">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${isPositive ? 'bg-crm-green-light' : 'bg-red-50'}`}>
          <Icon size={20} className={isPositive ? 'text-crm-green' : 'text-crm-danger'} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isPositive ? (
          <TrendingUp size={16} className="text-crm-green" />
        ) : (
          <TrendingDown size={16} className="text-crm-danger" />
        )}
        <span className={`text-sm font-medium ${isPositive ? 'text-crm-green' : 'text-crm-danger'}`}>
          {isPositive ? '+' : ''}{change}
        </span>
        <span className="text-sm text-crm-text-muted">vs last month</span>
      </div>
      {/* Sparkline */}
      <div className="flex items-end gap-1 mt-4 h-8">
        {[40, 55, 45, 65, 50, 70, 60, 75, 65, 80, 70, 85].map((h, i) => (
          <div
            key={i}
            className={`sparkline-bar flex-1 ${isPositive ? 'bg-crm-green/20' : 'bg-crm-danger/20'}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );

  const getStatusBadge = (stage) => {
    const badges = {
      won: 'badge-won',
      prospecting: 'badge-pending',
      proposal: 'badge-proposal',
      negotiation: 'badge-proposal',
      lost: 'badge-lost'
    };
    return badges[stage] || 'badge-pending';
  };

  const handleExportDeals = async () => {
    try {
      const response = await axios.get(`${API}/export/deals`);
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deals_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${response.data.count} deals exported successfully`);
    } catch (error) {
      toast.error('Failed to export deals');
    }
  };

  const filteredDeals = dealFilter === 'all' 
    ? recentDeals 
    : recentDeals.filter(d => d.stage === dealFilter);

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
        breadcrumb="Dashboard > Overview"
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Scott'}`}
        onSearch={() => {}}
        searchPlaceholder="Search anything..."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="kpi-cards">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(stats?.total_revenue || 0)}
          change={`${stats?.revenue_change || 0}%`}
          isPositive={stats?.revenue_change > 0}
          icon={DollarSign}
          delay={100}
        />
        <KPICard
          title="Open Orders"
          value={stats?.open_orders || 0}
          change={`+${stats?.orders_change || 0}`}
          isPositive={true}
          icon={FileText}
          delay={200}
        />
        <KPICard
          title="New Clients"
          value={stats?.new_clients || 0}
          change={`+${stats?.clients_change || 0}`}
          isPositive={true}
          icon={Users}
          delay={300}
        />
        <KPICard
          title="Avg Order Value"
          value={formatCurrency(stats?.avg_order_value || 0)}
          change={`${stats?.aov_change || 0}%`}
          isPositive={stats?.aov_change > 0}
          icon={TrendingUp}
          delay={400}
        />
      </div>

      {/* Quick Actions */}
      <div className="crm-card p-6 mb-8" data-testid="quick-actions">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} className="text-crm-warning" />
          <h3 className="font-medium text-lg">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Quick Deal */}
          <Dialog open={quickDealOpen} onOpenChange={setQuickDealOpen}>
            <DialogTrigger asChild>
              <button data-testid="quick-deal-btn" className="flex items-center gap-3 p-4 rounded-xl border border-crm-border hover:border-crm-green hover:bg-crm-green-light/30 transition-all group">
                <div className="p-2 bg-crm-green-light rounded-lg group-hover:bg-crm-green group-hover:text-white transition-colors">
                  <ClipboardList size={18} className="text-crm-green group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">New Deal</p>
                  <p className="text-xs text-crm-text-secondary">Add to pipeline</p>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Quick Add Deal</DialogTitle>
                <DialogDescription>Add a new deal to your sales pipeline quickly.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleQuickDeal} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="label-uppercase">Client Name</Label>
                  <Input value={newDeal.client_name} onChange={(e) => setNewDeal({...newDeal, client_name: e.target.value})} placeholder="Company name" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="label-uppercase">Amount ($)</Label>
                    <Input type="number" value={newDeal.amount} onChange={(e) => setNewDeal({...newDeal, amount: e.target.value})} placeholder="0.00" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-uppercase">Stage</Label>
                    <Select value={newDeal.stage} onValueChange={(v) => setNewDeal({...newDeal, stage: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospecting">Prospecting</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="label-uppercase">Product Description</Label>
                  <Input value={newDeal.product_description} onChange={(e) => setNewDeal({...newDeal, product_description: e.target.value})} placeholder="Brief description" required />
                </div>
                <Button type="submit" className="w-full btn-primary">Create Deal</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Quick Order */}
          <Dialog open={quickOrderOpen} onOpenChange={setQuickOrderOpen}>
            <DialogTrigger asChild>
              <button data-testid="quick-order-btn" className="flex items-center gap-3 p-4 rounded-xl border border-crm-border hover:border-crm-blue hover:bg-blue-50/50 transition-all group">
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-crm-blue group-hover:text-white transition-colors">
                  <Package size={18} className="text-crm-blue group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">New Order</p>
                  <p className="text-xs text-crm-text-secondary">Create order</p>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Quick Add Order</DialogTitle>
                <DialogDescription>Create a new order for a client quickly.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleQuickOrder} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="label-uppercase">Client</Label>
                  <Select value={newOrder.client_id} onValueChange={(v) => setNewOrder({...newOrder, client_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="label-uppercase">Products</Label>
                  <Input value={newOrder.products_description} onChange={(e) => setNewOrder({...newOrder, products_description: e.target.value})} placeholder="e.g., 100x Polo Shirts" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="label-uppercase">Amount ($)</Label>
                    <Input type="number" value={newOrder.amount} onChange={(e) => setNewOrder({...newOrder, amount: e.target.value})} placeholder="0.00" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-uppercase">Due Date</Label>
                    <Input type="date" value={newOrder.due_date} onChange={(e) => setNewOrder({...newOrder, due_date: e.target.value})} required />
                  </div>
                </div>
                <Button type="submit" className="w-full btn-primary">Create Order</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* View Pipeline */}
          <button onClick={() => navigate('/pipeline')} data-testid="quick-pipeline-btn" className="flex items-center gap-3 p-4 rounded-xl border border-crm-border hover:border-crm-purple hover:bg-purple-50/50 transition-all group">
            <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-crm-purple group-hover:text-white transition-colors">
              <TrendingUp size={18} className="text-crm-purple group-hover:text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Pipeline</p>
              <p className="text-xs text-crm-text-secondary">View deals</p>
            </div>
          </button>

          {/* View Reports */}
          <button onClick={() => navigate('/reports')} data-testid="quick-reports-btn" className="flex items-center gap-3 p-4 rounded-xl border border-crm-border hover:border-crm-warning hover:bg-amber-50/50 transition-all group">
            <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-crm-warning group-hover:text-white transition-colors">
              <FileText size={18} className="text-crm-warning group-hover:text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Reports</p>
              <p className="text-xs text-crm-text-secondary">View analytics</p>
            </div>
          </button>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 crm-card p-6" data-testid="sales-trend-chart">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-lg">Sales Trend</h3>
            <div className="flex gap-1 bg-crm-bg rounded-lg p-1">
              {['weekly', 'monthly', 'yearly'].map(view => (
                <button
                  key={view}
                  data-testid={`trend-${view}`}
                  onClick={() => setTrendView(view)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    trendView === view
                      ? 'bg-white text-crm-text-primary shadow-sm'
                      : 'text-crm-text-secondary hover:text-crm-text-primary'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-crm-green"></div>
              <span className="text-sm text-crm-text-secondary">New Clients</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-crm-text-primary"></div>
              <span className="text-sm text-crm-text-secondary">Repeat Clients</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesTrend} barGap={2}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#7a7a7a', fontSize: 12 }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e8e7e3',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="new_clients" fill="#2d6a4f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="repeat_clients" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Breakdown */}
        <div className="crm-card p-6" data-testid="pipeline-breakdown">
          <h3 className="font-medium text-lg mb-6">Pipeline Breakdown</h3>
          <div className="space-y-4">
            {pipelineSummary && Object.entries({
              'Proposals Sent': { value: pipelineSummary.proposal, color: 'bg-crm-green', percent: 78 },
              'Negotiation': { value: pipelineSummary.negotiation, color: 'bg-crm-blue', percent: 55 },
              'Awaiting Approval': { value: pipelineSummary.prospecting, color: 'bg-crm-warning', percent: 42 },
              'Closed Won': { value: pipelineSummary.won, color: 'bg-crm-green', percent: 30 },
              'Lost / Stale': { value: pipelineSummary.lost, color: 'bg-crm-danger', percent: 12 }
            }).map(([label, data]) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-crm-text-secondary">{label}</span>
                  <span className="font-medium">{formatCurrency(data.value)}</span>
                </div>
                <div className="h-2 bg-crm-bg rounded-full overflow-hidden">
                  <div
                    className={`h-full ${data.color} rounded-full transition-all duration-500`}
                    style={{ width: `${data.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Deals Table */}
      <div className="crm-card" data-testid="recent-deals">
        <div className="p-6 border-b border-crm-border flex items-center justify-between">
          <h3 className="font-medium text-lg">Recent Deals</h3>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="btn-secondary text-sm" data-testid="deals-filter-btn">
                  <Filter size={14} className="mr-2" /> Filter {dealFilter !== 'all' && `(${dealFilter})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-2">Filter by Stage</p>
                  {['all', 'prospecting', 'proposal', 'negotiation', 'won', 'lost'].map(stage => (
                    <button
                      key={stage}
                      onClick={() => setDealFilter(stage)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                        dealFilter === stage ? 'bg-crm-green-light text-crm-green' : 'hover:bg-crm-bg'
                      }`}
                    >
                      {stage === 'all' ? 'All Deals' : stage}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" className="btn-secondary text-sm" onClick={handleExportDeals} data-testid="deals-export-btn">
              <Download size={14} className="mr-2" /> Export
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentDeals.map((deal, index) => (
                <tr key={deal.id || index}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{ backgroundColor: deal.owner_color + '20', color: deal.owner_color }}>
                        {deal.owner_initials}
                      </div>
                      <span className="font-medium">{deal.client_name}</span>
                    </div>
                  </td>
                  <td className="text-crm-text-secondary">{deal.product_description}</td>
                  <td className="font-medium text-crm-green">{formatCurrency(deal.amount)}</td>
                  <td>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(deal.stage)}`}>
                      {deal.stage}
                    </span>
                  </td>
                  <td className="text-crm-text-secondary">
                    {new Date(deal.date_entered).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
