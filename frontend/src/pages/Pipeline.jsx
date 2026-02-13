import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Plus, Filter, List } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Pipeline = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    client_name: '', amount: '', product_description: '', stage: 'prospecting', 
    priority: 'medium', tags: [], owner_initials: 'SH', owner_color: '#2d6a4f'
  });

  const stages = [
    { id: 'prospecting', name: 'Prospecting', color: 'bg-gray-400' },
    { id: 'proposal', name: 'Proposal', color: 'bg-crm-blue' },
    { id: 'negotiation', name: 'Negotiation', color: 'bg-crm-purple' },
    { id: 'won', name: 'Closed Won', color: 'bg-crm-green' },
    { id: 'lost', name: 'Lost', color: 'bg-crm-danger' }
  ];

  const priorities = ['high', 'medium', 'low'];
  const tagOptions = ['Apparel', 'Drinkware', 'Tech', 'Bags', 'Office', 'Gifts', 'Outdoor'];

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await axios.get(`${API}/deals`);
      setDeals(response.data);
    } catch (error) {
      toast.error('Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStage = destination.droppableId;
    
    // Optimistic update
    setDeals(prev => prev.map(d => 
      d.id === draggableId ? { ...d, stage: newStage } : d
    ));
    
    try {
      await axios.put(`${API}/deals/${draggableId}`, { stage: newStage });
      toast.success(`Deal moved to ${stages.find(s => s.id === newStage)?.name}`);
    } catch (error) {
      toast.error('Failed to update deal');
      fetchDeals(); // Revert on error
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    try {
      const dealData = {
        ...newDeal,
        amount: parseFloat(newDeal.amount)
      };
      await axios.post(`${API}/deals`, dealData);
      toast.success('Deal created successfully');
      setIsModalOpen(false);
      setNewDeal({
        client_name: '', amount: '', product_description: '', stage: 'prospecting',
        priority: 'medium', tags: [], owner_initials: 'SH', owner_color: '#2d6a4f'
      });
      fetchDeals();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create deal');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const getDealsByStage = (stageId) => deals.filter(d => d.stage === stageId);
  
  const getStageTotal = (stageId) => getDealsByStage(stageId).reduce((acc, d) => acc + d.amount, 0);

  const totalPipeline = deals.reduce((acc, d) => acc + d.amount, 0);

  const getTagStyle = (tag) => {
    const styles = {
      Apparel: 'category-tag apparel',
      Drinkware: 'category-tag drinkware',
      Tech: 'category-tag tech',
      Bags: 'category-tag bags',
      Office: 'category-tag office',
      Gifts: 'category-tag gifts',
      Outdoor: 'category-tag outdoor'
    };
    return styles[tag] || 'category-tag';
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
        breadcrumb="Customers > Pipeline"
        title="Sales Pipeline"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="btn-secondary">
              <Filter size={16} className="mr-2" /> Filter
            </Button>
            <Button variant="outline" className="btn-secondary">
              <List size={16} className="mr-2" /> List View
            </Button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button data-testid="new-deal-btn" className="btn-primary">
                  <Plus size={16} className="mr-2" /> New Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Deal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateDeal} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="label-uppercase">Client Name</Label>
                    <Input
                      data-testid="deal-client-input"
                      value={newDeal.client_name}
                      onChange={(e) => setNewDeal({...newDeal, client_name: e.target.value})}
                      placeholder="Company name"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="label-uppercase">Amount ($)</Label>
                      <Input
                        data-testid="deal-amount-input"
                        type="number"
                        step="0.01"
                        value={newDeal.amount}
                        onChange={(e) => setNewDeal({...newDeal, amount: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="label-uppercase">Priority</Label>
                      <Select value={newDeal.priority} onValueChange={(v) => setNewDeal({...newDeal, priority: v})}>
                        <SelectTrigger data-testid="deal-priority-select">
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
                    <Label className="label-uppercase">Product Description</Label>
                    <Textarea
                      data-testid="deal-description-input"
                      value={newDeal.product_description}
                      onChange={(e) => setNewDeal({...newDeal, product_description: e.target.value})}
                      placeholder="Describe the products"
                      rows={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-uppercase">Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {tagOptions.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const tags = newDeal.tags.includes(tag)
                              ? newDeal.tags.filter(t => t !== tag)
                              : [...newDeal.tags, tag];
                            setNewDeal({...newDeal, tags});
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            newDeal.tags.includes(tag)
                              ? 'bg-crm-green text-white'
                              : 'bg-crm-bg text-crm-text-secondary hover:bg-crm-hover'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" data-testid="deal-submit-btn" className="w-full btn-primary">
                    Create Deal
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Pipeline Summary Bar */}
      <div className="crm-card p-4 mb-6" data-testid="pipeline-summary-bar">
        <div className="flex h-8 rounded-lg overflow-hidden">
          {stages.map(stage => {
            const total = getStageTotal(stage.id);
            const percent = totalPipeline > 0 ? (total / totalPipeline) * 100 : 0;
            if (percent === 0) return null;
            return (
              <div
                key={stage.id}
                className={`${stage.color} flex items-center justify-center text-white text-xs font-medium transition-all`}
                style={{ width: `${percent}%`, minWidth: percent > 5 ? '80px' : '0' }}
                title={`${stage.name}: ${formatCurrency(total)}`}
              >
                {percent > 10 && formatCurrency(total)}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-3 text-xs">
          {stages.map(stage => (
            <div key={stage.id} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${stage.color}`}></span>
              <span className="text-crm-text-secondary">{stage.name}</span>
              <span className="font-medium">{formatCurrency(getStageTotal(stage.id))}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" data-testid="pipeline-board">
          {stages.map(stage => (
            <div key={stage.id} className="flex-shrink-0 w-80">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${stage.color}`}></span>
                  <span className="font-medium">{stage.name}</span>
                  <span className="text-crm-text-secondary text-sm">({getDealsByStage(stage.id).length})</span>
                </div>
                <button className="p-1 hover:bg-crm-hover rounded transition-colors">
                  <Plus size={16} className="text-crm-text-secondary" />
                </button>
              </div>

              {/* Droppable Column */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] p-2 rounded-xl transition-colors ${
                      snapshot.isDraggingOver ? 'bg-crm-green-light/50' : 'bg-crm-bg/50'
                    }`}
                  >
                    {getDealsByStage(stage.id).map((deal, index) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            data-testid={`deal-card-${deal.id}`}
                            className={`pipeline-card ${stage.id === 'won' ? 'won' : ''} ${stage.id === 'lost' ? 'lost' : ''} ${
                              snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                            }`}
                          >
                            {/* Priority indicator */}
                            <div className={`absolute top-0 right-0 w-1 h-6 rounded-bl ${
                              deal.priority === 'high' ? 'bg-crm-danger' : 
                              deal.priority === 'medium' ? 'bg-crm-warning' : 'bg-crm-green'
                            }`}></div>

                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                              <span className="font-medium">{deal.client_name}</span>
                              <span className="text-crm-green font-bold">{formatCurrency(deal.amount)}</span>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-crm-text-secondary line-clamp-2 mb-3">
                              {deal.product_description}
                            </p>

                            {/* Tags */}
                            {deal.tags && deal.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {deal.tags.map(tag => (
                                  <span key={tag} className={getTagStyle(tag)}>{tag}</span>
                                ))}
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between text-xs text-crm-text-secondary">
                              <span>{new Date(deal.date_entered).toLocaleDateString()}</span>
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium"
                                style={{ backgroundColor: deal.owner_color + '20', color: deal.owner_color }}
                              >
                                {deal.owner_initials}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </Layout>
  );
};

export default Pipeline;
