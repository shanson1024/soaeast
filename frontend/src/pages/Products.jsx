import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, ShoppingCart, Users, ExternalLink, Shirt, Coffee, Monitor, ShoppingBag, Briefcase, Gift, TreePine } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Company Casuals catalog categories
const catalogCategories = [
  { 
    name: 'T-Shirts', 
    icon: Shirt, 
    color: 'bg-purple-100 text-purple-700',
    url: 'https://www.companycasuals.com/SoaMarketing/b.jsp?id=125&ln=125',
    subcategories: ['100% Cotton', 'Performance', 'Eco-Friendly', 'Long Sleeve', "Women's", 'Youth']
  },
  { 
    name: 'Polos/Knits', 
    icon: Shirt, 
    color: 'bg-blue-100 text-blue-700',
    url: 'https://www.companycasuals.com/SoaMarketing/b.jsp?id=115&ln=115',
    subcategories: ['Performance', 'Easy Care', 'Silk Touch™', 'Cotton', "Women's"]
  },
  { 
    name: 'Sweatshirts/Fleece', 
    icon: Shirt, 
    color: 'bg-amber-100 text-amber-700',
    url: 'https://www.companycasuals.com/SoaMarketing/b.jsp?id=127&ln=127',
    subcategories: ['Crewnecks', 'Hoodie', 'Full Zip', '1/4 Zip', 'Sweatpants']
  },
  { 
    name: 'Caps', 
    icon: Gift, 
    color: 'bg-green-100 text-green-700',
    url: 'https://www.companycasuals.com/SoaMarketing/b.jsp?id=126&ln=126',
    subcategories: ['Stretch-to-Fit', 'Performance', 'Fashion', 'Beanies', 'Visors']
  },
  { 
    name: 'Outerwear', 
    icon: TreePine, 
    color: 'bg-cyan-100 text-cyan-700',
    url: 'https://www.companycasuals.com/SoaMarketing/b.jsp?id=117&ln=117',
    subcategories: ['Soft Shells', 'Fleece', 'Rainwear', 'Vests', 'Insulated']
  },
  { 
    name: 'Bags', 
    icon: ShoppingBag, 
    color: 'bg-pink-100 text-pink-700',
    url: 'https://www.companycasuals.com/SoaMarketing/b.jsp?id=130&ln=130',
    subcategories: ['Backpacks', 'Duffels', 'Totes', 'Coolers', 'Travel Bags']
  },
  { 
    name: 'Woven Shirts', 
    icon: Briefcase, 
    color: 'bg-indigo-100 text-indigo-700',
    url: 'https://www.companycasuals.com/SoaMarketing/b.jsp?id=121&ln=121',
    subcategories: ['Easy Care', 'Oxfords', 'Denim', 'Camp Shirts']
  },
  { 
    name: 'Workwear', 
    icon: Monitor, 
    color: 'bg-orange-100 text-orange-700',
    url: 'https://www.companycasuals.com/SoaMarketing/b.jsp?id=1303136&ln=1303136',
    subcategories: ['Work Shirts', 'Work Pants', 'Safety', 'Aprons', 'Medical']
  },
];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('catalog');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', category: 'apparel', description: '', base_price: '', badge: '', margin_percent: 30
  });

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'apparel', label: 'Apparel' },
    { value: 'drinkware', label: 'Drinkware' },
    { value: 'tech', label: 'Tech Accessories' },
    { value: 'bags', label: 'Bags & Totes' },
    { value: 'office', label: 'Office & Desk' },
    { value: 'gifts', label: 'Gift Sets' },
    { value: 'outdoor', label: 'Outdoor' }
  ];

  const badges = ['', 'popular', 'new', 'seasonal'];

  const categoryIcons = {
    apparel: '👕',
    drinkware: '☕',
    tech: '📱',
    bags: '👜',
    office: '📒',
    gifts: '🎁',
    outdoor: '🏕️'
  };

  const categoryColors = {
    apparel: 'bg-purple-100',
    drinkware: 'bg-blue-100',
    tech: 'bg-cyan-100',
    bags: 'bg-amber-100',
    office: 'bg-gray-100',
    gifts: 'bg-pink-100',
    outdoor: 'bg-green-100'
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, activeCategory]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];
    
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    
    setFilteredProducts(filtered);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...newProduct,
        base_price: parseFloat(newProduct.base_price),
        badge: newProduct.badge || null
      };
      await axios.post(`${API}/products`, productData);
      toast.success('Product created successfully');
      setIsModalOpen(false);
      setNewProduct({ name: '', category: 'apparel', description: '', base_price: '', badge: '', margin_percent: 30 });
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create product');
    }
  };

  const getBadgeStyle = (badge) => {
    const styles = {
      popular: 'bg-crm-green text-white',
      new: 'bg-crm-blue text-white',
      seasonal: 'bg-crm-warning text-white'
    };
    return styles[badge] || '';
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
        breadcrumb="Main Menu > Products"
        title="Product Catalog"
        onSearch={setSearchQuery}
        searchPlaceholder="Search products..."
        actions={
          <div className="flex gap-2">
            <a 
              href="https://www.companycasuals.com/SoaMarketing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-crm-border hover:bg-crm-hover transition-colors"
              data-testid="view-full-catalog-btn"
            >
              <ExternalLink size={16} /> Full Catalog
            </a>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-product-btn" className="btn-primary">
                  <Plus size={16} className="mr-2" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>Add a new product to your catalog with pricing and details.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProduct} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="label-uppercase">Name</Label>
                    <Input
                      data-testid="product-name-input"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="Product name"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="label-uppercase">Category</Label>
                      <Select value={newProduct.category} onValueChange={(v) => setNewProduct({...newProduct, category: v})}>
                        <SelectTrigger data-testid="product-category-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c.value !== 'all').map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="label-uppercase">Badge</Label>
                      <Select value={newProduct.badge} onValueChange={(v) => setNewProduct({...newProduct, badge: v})}>
                        <SelectTrigger data-testid="product-badge-select">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {badges.filter(b => b).map(badge => (
                            <SelectItem key={badge} value={badge} className="capitalize">{badge}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="label-uppercase">Description</Label>
                    <Textarea
                      data-testid="product-description-input"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      placeholder="Product description"
                      rows={2}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="label-uppercase">Base Price ($)</Label>
                      <Input
                        data-testid="product-price-input"
                        type="number"
                        step="0.01"
                        value={newProduct.base_price}
                        onChange={(e) => setNewProduct({...newProduct, base_price: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="label-uppercase">Margin %</Label>
                      <Input
                        data-testid="product-margin-input"
                        type="number"
                        value={newProduct.margin_percent}
                        onChange={(e) => setNewProduct({...newProduct, margin_percent: parseInt(e.target.value)})}
                        placeholder="30"
                      />
                    </div>
                  </div>
                  <Button type="submit" data-testid="product-submit-btn" className="w-full btn-primary">
                    Create Product
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-crm-bg border border-crm-border">
          <TabsTrigger data-testid="tab-catalog" value="catalog" className="data-[state=active]:bg-white">
            Browse Catalog
          </TabsTrigger>
          <TabsTrigger data-testid="tab-tracked" value="tracked" className="data-[state=active]:bg-white">
            Tracked Products ({products.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'catalog' ? (
        <>
          {/* Company Casuals Catalog Banner */}
          <div className="crm-card p-6 mb-6 bg-gradient-to-r from-crm-green-light/50 to-white" data-testid="catalog-banner">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl mb-2">SOA Marketing Product Catalog</h3>
                <p className="text-crm-text-secondary">Browse our full range of promotional products from Company Casuals. Click any category to view products and pricing.</p>
              </div>
              <a 
                href="https://www.companycasuals.com/SoaMarketing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 whitespace-nowrap"
                data-testid="browse-all-btn"
              >
                Browse All Products <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="catalog-categories">
            {catalogCategories.map((cat, index) => (
              <a
                key={cat.name}
                href={cat.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`crm-card p-5 hover:shadow-lg transition-all group cursor-pointer opacity-0 animate-fade-up`}
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`catalog-category-${cat.name.toLowerCase().replace(/\//g, '-')}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${cat.color} group-hover:scale-110 transition-transform`}>
                    <cat.icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{cat.name}</h4>
                      <ExternalLink size={14} className="text-crm-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-crm-text-secondary line-clamp-2">
                      {cat.subcategories.join(' • ')}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Quick Links */}
          <div className="crm-card p-6" data-testid="quick-links">
            <h3 className="font-medium text-lg mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { name: "Women's", url: 'https://www.companycasuals.com/SoaMarketing/b.jsp?id=7794661&ln=7794661' },
                { name: 'Youth', url: 'https://www.companycasuals.com/SoaMarketing/b.jsp?id=7794659&ln=7794659' },
                { name: 'Tall Sizes', url: 'https://www.companycasuals.com/SoaMarketing/b.jsp?id=7794660&ln=7794660' },
                { name: 'Activewear', url: 'https://www.companycasuals.com/SoaMarketing/b.jsp?id=124&ln=124' },
                { name: 'Accessories', url: 'https://www.companycasuals.com/SoaMarketing/b.jsp?id=129&ln=129' },
                { name: 'Safety/PPE', url: 'https://www.companycasuals.com/SoaMarketing/b.jsp?id=18036668&ln=18036668' },
              ].map(link => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-lg border border-crm-border text-center text-sm font-medium hover:border-crm-green hover:text-crm-green hover:bg-crm-green-light/30 transition-all"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Category Filter for tracked products */}
          <div className="flex gap-2 flex-wrap mb-6" data-testid="category-filters">
            {categories.map(cat => (
              <button
                key={cat.value}
                data-testid={`category-${cat.value}`}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.value
                    ? 'bg-crm-green text-white'
                    : 'bg-white border border-crm-border text-crm-text-secondary hover:border-crm-green hover:text-crm-green'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className={`crm-card overflow-hidden opacity-0 animate-fade-up`}
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`product-card-${product.id}`}
              >
                {/* Image Area */}
                <div className={`h-40 ${categoryColors[product.category] || 'bg-gray-100'} flex items-center justify-center relative`}>
                  <span className="text-5xl">{categoryIcons[product.category] || '📦'}</span>
                  {product.badge && (
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getBadgeStyle(product.badge)}`}>
                      {product.badge}
                    </span>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <p className="label-uppercase text-[9px] mb-1">{product.category}</p>
                  <h3 className="font-medium text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-crm-text-secondary line-clamp-2 mb-3">{product.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-crm-green">From ${product.base_price.toFixed(2)}</span>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-crm-text-secondary mb-3">
                    <div className="flex items-center gap-1">
                      <ShoppingCart size={14} />
                      <span>{product.total_orders}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{product.total_clients}</span>
                    </div>
                  </div>
                  
                  {/* Margin Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-crm-text-secondary">Margin</span>
                      <span className="font-medium">{product.margin_percent}%</span>
                    </div>
                    <div className="h-1.5 bg-crm-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-crm-green rounded-full"
                        style={{ width: `${product.margin_percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-crm-text-secondary">
              No products found
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default Products;
