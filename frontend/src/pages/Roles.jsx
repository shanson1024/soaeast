import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
  Shield, Plus, Users, MoreHorizontal, Check, X, 
  LayoutGrid, UserCircle, Package, FileText, ClipboardList, 
  BarChart3, Settings, UsersRound, Pencil, Trash2, Mail
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const permissionModules = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { key: 'clients', label: 'Clients', icon: UserCircle },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: FileText },
  { key: 'pipeline', label: 'Pipeline', icon: ClipboardList },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'team', label: 'Team', icon: UsersRound },
];

const permissionActions = {
  dashboard: ['view'],
  clients: ['view', 'create', 'edit', 'delete'],
  products: ['view', 'create', 'edit', 'delete'],
  orders: ['view', 'create', 'edit', 'delete'],
  pipeline: ['view', 'create', 'edit', 'delete'],
  reports: ['view', 'export'],
  settings: ['view', 'edit'],
  team: ['view', 'manage'],
};

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roles');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    color: '#2d6a4f',
    permissions: {}
  });
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // First seed default roles if needed
      await axios.post(`${API}/roles/seed-defaults`).catch(() => {});
      
      const [rolesRes, teamRes] = await Promise.all([
        axios.get(`${API}/roles`),
        axios.get(`${API}/team`)
      ]);
      setRoles(rolesRes.data);
      setTeamMembers(teamRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load roles data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await axios.put(`${API}/roles/${editingRole.id}`, newRole);
        toast.success('Role updated successfully');
      } else {
        await axios.post(`${API}/roles`, newRole);
        toast.success('Role created successfully');
      }
      setIsRoleModalOpen(false);
      setEditingRole(null);
      setNewRole({ name: '', description: '', color: '#2d6a4f', permissions: {} });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await axios.delete(`${API}/roles/${roleId}`);
      toast.success('Role deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete role');
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setNewRole({
      name: role.name,
      description: role.description,
      color: role.color,
      permissions: role.permissions
    });
    setIsRoleModalOpen(true);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/team/invite`, null, {
        params: inviteData
      });
      toast.success(`Invitation sent! Temp password: ${response.data.temp_password}`);
      setIsInviteModalOpen(false);
      setInviteData({ name: '', email: '', role_id: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to invite member');
    }
  };

  const handleUpdateMemberRole = async (userId, roleId) => {
    try {
      const role = roles.find(r => r.id === roleId);
      await axios.put(`${API}/team/${userId}`, {
        role_id: roleId,
        role: role?.name || ''
      });
      toast.success('Member role updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update member');
    }
  };

  const togglePermission = (module, action) => {
    setNewRole(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...(prev.permissions[module] || {}),
          [action]: !(prev.permissions[module]?.[action])
        }
      }
    }));
  };

  const colorOptions = [
    { value: '#2d6a4f', label: 'Green' },
    { value: '#4a5fd7', label: 'Blue' },
    { value: '#7c3aed', label: 'Purple' },
    { value: '#e6a817', label: 'Yellow' },
    { value: '#d64545', label: 'Red' },
    { value: '#6b7280', label: 'Gray' },
  ];

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
        breadcrumb="Management > Roles"
        title="Roles & Team"
        actions={
          <div className="flex gap-2">
            {activeTab === 'team' ? (
              <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="invite-member-btn" className="btn-primary">
                    <Mail size={16} className="mr-2" /> Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>Send an invitation to join your team.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInvite} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="label-uppercase">Name</Label>
                      <Input
                        data-testid="invite-name-input"
                        value={inviteData.name}
                        onChange={(e) => setInviteData({...inviteData, name: e.target.value})}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="label-uppercase">Email</Label>
                      <Input
                        data-testid="invite-email-input"
                        type="email"
                        value={inviteData.email}
                        onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                        placeholder="email@company.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="label-uppercase">Role</Label>
                      <Select value={inviteData.role_id} onValueChange={(v) => setInviteData({...inviteData, role_id: v})}>
                        <SelectTrigger data-testid="invite-role-select">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }}></span>
                                {role.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" data-testid="invite-submit-btn" className="w-full btn-primary">
                      Send Invitation
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={isRoleModalOpen} onOpenChange={(open) => {
                setIsRoleModalOpen(open);
                if (!open) {
                  setEditingRole(null);
                  setNewRole({ name: '', description: '', color: '#2d6a4f', permissions: {} });
                }
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="create-role-btn" className="btn-primary">
                    <Plus size={16} className="mr-2" /> Create Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
                    <DialogDescription>Define permissions for this role.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateRole} className="space-y-6 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="label-uppercase">Role Name</Label>
                        <Input
                          data-testid="role-name-input"
                          value={newRole.name}
                          onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                          placeholder="e.g., Sales Manager"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="label-uppercase">Color</Label>
                        <Select value={newRole.color} onValueChange={(v) => setNewRole({...newRole, color: v})}>
                          <SelectTrigger data-testid="role-color-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {colorOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.value }}></span>
                                  {opt.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="label-uppercase">Description</Label>
                      <Input
                        data-testid="role-description-input"
                        value={newRole.description}
                        onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                        placeholder="Brief description of this role"
                      />
                    </div>

                    {/* Permissions Matrix */}
                    <div className="space-y-3">
                      <Label className="label-uppercase">Permissions</Label>
                      <div className="border border-crm-border rounded-xl overflow-hidden">
                        <div className="bg-crm-bg px-4 py-2 border-b border-crm-border">
                          <div className="grid grid-cols-6 gap-2">
                            <div className="col-span-2 text-xs font-medium text-crm-text-secondary">Module</div>
                            <div className="text-xs font-medium text-crm-text-secondary text-center">View</div>
                            <div className="text-xs font-medium text-crm-text-secondary text-center">Create</div>
                            <div className="text-xs font-medium text-crm-text-secondary text-center">Edit</div>
                            <div className="text-xs font-medium text-crm-text-secondary text-center">Delete</div>
                          </div>
                        </div>
                        {permissionModules.map(module => {
                          const actions = permissionActions[module.key];
                          return (
                            <div key={module.key} className="px-4 py-3 border-b border-crm-border last:border-b-0 hover:bg-crm-hover/50">
                              <div className="grid grid-cols-6 gap-2 items-center">
                                <div className="col-span-2 flex items-center gap-2">
                                  <module.icon size={16} className="text-crm-text-secondary" />
                                  <span className="text-sm font-medium">{module.label}</span>
                                </div>
                                {['view', 'create', 'edit', 'delete'].map(action => {
                                  const hasAction = actions.includes(action) || 
                                    (action === 'create' && actions.includes('export')) ||
                                    (action === 'edit' && actions.includes('manage'));
                                  const actualAction = action === 'create' && actions.includes('export') ? 'export' :
                                    action === 'edit' && actions.includes('manage') ? 'manage' : action;
                                  
                                  if (!actions.includes(action) && !hasAction) {
                                    return <div key={action} className="flex justify-center">-</div>;
                                  }
                                  
                                  return (
                                    <div key={action} className="flex justify-center">
                                      <Switch
                                        checked={newRole.permissions[module.key]?.[actualAction] || false}
                                        onCheckedChange={() => togglePermission(module.key, actualAction)}
                                        className="data-[state=checked]:bg-crm-green"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <Button type="submit" data-testid="role-submit-btn" className="w-full btn-primary">
                      {editingRole ? 'Update Role' : 'Create Role'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-crm-bg border border-crm-border">
          <TabsTrigger data-testid="tab-roles" value="roles" className="data-[state=active]:bg-white">
            <Shield size={16} className="mr-2" /> Roles ({roles.length})
          </TabsTrigger>
          <TabsTrigger data-testid="tab-team" value="team" className="data-[state=active]:bg-white">
            <Users size={16} className="mr-2" /> Team Members ({teamMembers.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'roles' ? (
        /* Roles Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="roles-grid">
          {roles.map((role, index) => (
            <div 
              key={role.id} 
              className={`crm-card p-6 opacity-0 animate-fade-up`}
              style={{ animationDelay: `${index * 50}ms` }}
              data-testid={`role-card-${role.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: role.color + '20' }}
                  >
                    <Shield size={20} style={{ color: role.color }} />
                  </div>
                  <div>
                    <h3 className="font-medium">{role.name}</h3>
                    <p className="text-xs text-crm-text-secondary">{role.user_count} members</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditRole(role)}
                    className="p-2 hover:bg-crm-hover rounded-lg transition-colors"
                    data-testid={`edit-role-${role.id}`}
                  >
                    <Pencil size={14} className="text-crm-text-secondary" />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    data-testid={`delete-role-${role.id}`}
                  >
                    <Trash2 size={14} className="text-crm-danger" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-crm-text-secondary mb-4">{role.description}</p>

              {/* Permission Summary */}
              <div className="space-y-2">
                <p className="label-uppercase text-[9px]">Permissions</p>
                <div className="flex flex-wrap gap-1.5">
                  {permissionModules.map(module => {
                    const perms = role.permissions[module.key];
                    if (!perms?.view) return null;
                    const canEdit = perms.edit || perms.manage;
                    const canDelete = perms.delete;
                    
                    return (
                      <span
                        key={module.key}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                          canDelete ? 'bg-crm-green-light text-crm-green' :
                          canEdit ? 'bg-blue-50 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {module.label}
                        {canDelete && <Check size={10} />}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Team Members Table */
        <div className="crm-card overflow-hidden" data-testid="team-table">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
                          style={{ 
                            backgroundColor: roles.find(r => r.id === member.role_id)?.color + '20' || '#2d6a4f20',
                            color: roles.find(r => r.id === member.role_id)?.color || '#2d6a4f'
                          }}
                        >
                          {member.initials}
                        </div>
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </td>
                    <td className="text-crm-text-secondary">{member.email}</td>
                    <td>
                      <Select 
                        value={member.role_id || ''} 
                        onValueChange={(v) => handleUpdateMemberRole(member.id, v)}
                      >
                        <SelectTrigger className="w-40 h-8 text-sm" data-testid={`member-role-${member.id}`}>
                          <SelectValue placeholder={member.role || 'Select role'} />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }}></span>
                                {role.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        member.status === 'active' ? 'bg-crm-green-light text-crm-green' :
                        member.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {member.status || 'active'}
                      </span>
                    </td>
                    <td className="text-crm-text-secondary">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="p-2 hover:bg-crm-hover rounded-lg transition-colors">
                        <MoreHorizontal size={16} className="text-crm-text-secondary" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Roles;
