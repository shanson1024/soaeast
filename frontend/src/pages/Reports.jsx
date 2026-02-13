import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { Download, TrendingUp, TrendingDown, Users, Package, DollarSign, Target } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const [statsRes, clientsRes, ordersRes, dealsRes, productsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/clients`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/deals`),
        axios.get(`${API}/products`)
      ]);
      setStats(statsRes.data);
      setClients(clientsRes.data);
      setOrders(ordersRes.data);
      setDeals(dealsRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  // Calculate metrics
  const totalRevenue = orders.reduce((acc, o) => acc + o.amount, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const conversionRate = deals.length > 0 ? (deals.filter(d => d.stage === 'won').length / deals.length * 100).toFixed(1) : 0;

  // Revenue by industry
  const revenueByIndustry = clients.reduce((acc, client) => {
    const industry = client.industry || 'Other';
    acc[industry] = (acc[industry] || 0) + client.total_revenue;
    return acc;
  }, {});

  const industryChartData = Object.entries(revenueByIndustry)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Orders by status
  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const orderStatusData = Object.entries(ordersByStatus).map(([name, value]) => ({ name, value }));

  // Pipeline by stage
  const pipelineData = deals.reduce((acc, deal) => {
    const stage = deal.stage.charAt(0).toUpperCase() + deal.stage.slice(1);
    acc[stage] = (acc[stage] || 0) + deal.amount;
    return acc;
  }, {});

  const pipelineChartData = Object.entries(pipelineData).map(([name, value]) => ({ name, value }));

  // Client tiers distribution
  const tierData = clients.reduce((acc, client) => {
    const tier = client.tier.charAt(0).toUpperCase() + client.tier.slice(1);
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  const tierChartData = Object.entries(tierData).map(([name, value]) => ({ name, value }));

  // Top products by orders
  const topProducts = [...products]
    .sort((a, b) => b.total_orders - a.total_orders)
    .slice(0, 5)
    .map(p => ({ name: p.name, orders: p.total_orders, clients: p.total_clients }));

  // Monthly revenue trend (simulated)
  const monthlyTrend = [
    { month: 'Jan', revenue: 42000, orders: 28 },
    { month: 'Feb', revenue: 38000, orders: 24 },
    { month: 'Mar', revenue: 55000, orders: 35 },
    { month: 'Apr', revenue: 48000, orders: 31 },
    { month: 'May', revenue: 62000, orders: 42 },
    { month: 'Jun', revenue: 58000, orders: 38 },
    { month: 'Jul', revenue: 71000, orders: 47 },
    { month: 'Aug', revenue: 68000, orders: 44 },
    { month: 'Sep', revenue: 75000, orders: 51 },
    { month: 'Oct', revenue: 82000, orders: 55 },
    { month: 'Nov', revenue: 78000, orders: 52 },
    { month: 'Dec', revenue: totalRevenue || 85000, orders: orders.length || 58 }
  ];

  const COLORS = ['#2d6a4f', '#4a5fd7', '#7c3aed', '#e6a817', '#d64545', '#40916c'];

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
        breadcrumb="Main Menu > Reports"
        title="Analytics & Reports"
        actions={
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-36 bg-white" data-testid="date-range-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button className="btn-secondary" data-testid="export-report-btn">
              <Download size={16} className="mr-2" /> Export PDF
            </Button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="report-kpis">
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-crm-green-light rounded-lg">
              <DollarSign size={18} className="text-crm-green" />
            </div>
            <div className="flex items-center gap-1 text-crm-green text-sm">
              <TrendingUp size={14} /> +12.4%
            </div>
          </div>
          <p className="label-uppercase text-[9px] mb-1">Total Revenue</p>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package size={18} className="text-crm-blue" />
            </div>
            <div className="flex items-center gap-1 text-crm-green text-sm">
              <TrendingUp size={14} /> +8
            </div>
          </div>
          <p className="label-uppercase text-[9px] mb-1">Total Orders</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>

        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users size={18} className="text-crm-purple" />
            </div>
            <div className="flex items-center gap-1 text-crm-green text-sm">
              <TrendingUp size={14} /> +3
            </div>
          </div>
          <p className="label-uppercase text-[9px] mb-1">Active Clients</p>
          <p className="text-2xl font-bold">{activeClients}</p>
        </div>

        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Target size={18} className="text-crm-warning" />
            </div>
            <div className="flex items-center gap-1 text-crm-danger text-sm">
              <TrendingDown size={14} /> -2.1%
            </div>
          </div>
          <p className="label-uppercase text-[9px] mb-1">Conversion Rate</p>
          <p className="text-2xl font-bold">{conversionRate}%</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend */}
        <div className="crm-card p-6" data-testid="revenue-trend-chart">
          <h3 className="font-medium text-lg mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#7a7a7a', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7a7a7a', fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e8e7e3', borderRadius: '10px' }}
                formatter={(value) => formatCurrency(value)}
              />
              <Area type="monotone" dataKey="revenue" stroke="#2d6a4f" strokeWidth={2} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Industry */}
        <div className="crm-card p-6" data-testid="industry-chart">
          <h3 className="font-medium text-lg mb-4">Revenue by Industry</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={industryChartData} layout="vertical">
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#7a7a7a', fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7a7a7a', fontSize: 11 }} width={100} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e8e7e3', borderRadius: '10px' }}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="value" fill="#2d6a4f" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Pipeline Value */}
        <div className="crm-card p-6" data-testid="pipeline-chart">
          <h3 className="font-medium text-lg mb-4">Pipeline by Stage</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pipelineChartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pipelineChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e8e7e3', borderRadius: '10px' }}
                formatter={(value) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {pipelineChartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-crm-text-secondary">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Client Tiers */}
        <div className="crm-card p-6" data-testid="tiers-chart">
          <h3 className="font-medium text-lg mb-4">Client Tiers</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={tierChartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {tierChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={
                    entry.name === 'Gold' ? '#eab308' :
                    entry.name === 'Silver' ? '#9ca3af' :
                    entry.name === 'Bronze' ? '#d97706' : '#2d6a4f'
                  } />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e8e7e3', borderRadius: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {tierChartData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 
                  entry.name === 'Gold' ? '#eab308' :
                  entry.name === 'Silver' ? '#9ca3af' :
                  entry.name === 'Bronze' ? '#d97706' : '#2d6a4f'
                }}></span>
                <span className="text-crm-text-secondary">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status */}
        <div className="crm-card p-6" data-testid="order-status-chart">
          <h3 className="font-medium text-lg mb-4">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={orderStatusData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7a7a7a', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7a7a7a', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e8e7e3', borderRadius: '10px' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={
                    entry.name === 'delivered' ? '#2d6a4f' :
                    entry.name === 'shipped' ? '#40916c' :
                    entry.name === 'production' ? '#4a5fd7' :
                    entry.name === 'draft' ? '#9ca3af' : '#d64545'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="crm-card" data-testid="top-products-table">
        <div className="p-6 border-b border-crm-border">
          <h3 className="font-medium text-lg">Top Performing Products</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>Total Orders</th>
                <th>Unique Clients</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={product.name}>
                  <td>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-amber-100 text-amber-700' : 'bg-crm-bg text-crm-text-secondary'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="font-medium">{product.name}</td>
                  <td>{product.orders}</td>
                  <td>{product.clients}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-crm-bg rounded-full overflow-hidden max-w-[100px]">
                        <div 
                          className="h-full bg-crm-green rounded-full"
                          style={{ width: `${(product.orders / (topProducts[0]?.orders || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-crm-text-secondary">{Math.round((product.orders / (topProducts[0]?.orders || 1)) * 100)}%</span>
                    </div>
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

export default Reports;
