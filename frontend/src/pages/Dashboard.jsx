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
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, FileText, Users, DollarSign, Filter, Download, Plus, Package, ClipboardList, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
            <Button variant="outline" size="sm" className="btn-secondary text-sm">
              <Filter size={14} className="mr-2" /> Filter
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
