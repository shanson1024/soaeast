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
import { toast } from 'sonner';
import { Plus, ShoppingCart, Users } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
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
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-product-btn" className="btn-primary">
                <Plus size={16} className="mr-2" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
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
        }
      />

      {/* Category Filter */}
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
    </Layout>
  );
};

export default Products;
