import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Mail, Inbox, Send, Trash2, CheckCircle, Circle, Search } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [team, setTeam] = useState([]);
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    recipient_name: '',
    subject: '',
    content: '',
    message_type: 'internal'
  });

  useEffect(() => {
    fetchMessages();
    fetchTeam();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, searchQuery, activeTab]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async () => {
    try {
      const response = await axios.get(`${API}/team`);
      setTeam(response.data);
    } catch (error) {
      console.error('Failed to fetch team:', error);
    }
  };

  const filterMessages = () => {
    let filtered = [...messages];
    
    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeTab === 'unread') {
      filtered = filtered.filter(m => !m.is_read);
    } else if (activeTab === 'sent') {
      filtered = filtered.filter(m => m.message_type === 'sent');
    }
    
    setFilteredMessages(filtered);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const recipient = team.find(t => t.id === newMessage.recipient_id);
      await axios.post(`${API}/messages`, {
        ...newMessage,
        recipient_name: recipient?.name || newMessage.recipient_name
      });
      toast.success('Message sent successfully');
      setIsComposeOpen(false);
      setNewMessage({ recipient_id: '', recipient_name: '', subject: '', content: '', message_type: 'internal' });
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await axios.put(`${API}/messages/${messageId}/read`);
      setMessages(messages.map(m => m.id === messageId ? { ...m, is_read: true } : m));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, is_read: true });
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await axios.delete(`${API}/messages/${messageId}`);
      toast.success('Message deleted');
      setMessages(messages.filter(m => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleSelectMessage = async (message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      await handleMarkAsRead(message.id);
    }
  };

  const stats = {
    total: messages.length,
    unread: messages.filter(m => !m.is_read).length,
    sent: messages.filter(m => m.message_type === 'sent').length
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
        breadcrumb="Main Menu > Messages"
        title="Messages"
        actions={
          <Button data-testid="compose-btn" className="btn-primary" onClick={() => setIsComposeOpen(true)}>
            <Plus size={16} className="mr-2" /> Compose
          </Button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6" data-testid="message-stats">
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-crm-green-light rounded-xl">
            <Inbox size={20} className="text-crm-green" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Total Messages</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Circle size={20} className="text-crm-blue" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Unread</p>
            <p className="text-2xl font-bold">{stats.unread}</p>
          </div>
        </div>
        <div className="crm-card p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <Send size={20} className="text-crm-purple" />
          </div>
          <div>
            <p className="label-uppercase text-[9px]">Sent</p>
            <p className="text-2xl font-bold">{stats.sent}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1 crm-card flex flex-col" data-testid="message-list">
          <div className="p-4 border-b border-crm-border">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-crm-text-secondary" />
              <Input
                data-testid="message-search"
                placeholder="Search messages..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
              <TabsList className="w-full bg-crm-bg">
                <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-white">All</TabsTrigger>
                <TabsTrigger value="unread" className="flex-1 data-[state=active]:bg-white">Unread</TabsTrigger>
                <TabsTrigger value="sent" className="flex-1 data-[state=active]:bg-white">Sent</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px]">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-crm-text-secondary">
                <Mail size={32} className="mx-auto mb-2 opacity-50" />
                <p>No messages found</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  data-testid={`message-item-${message.id}`}
                  onClick={() => handleSelectMessage(message)}
                  className={`p-4 border-b border-crm-border cursor-pointer hover:bg-crm-bg transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-crm-green-light/30' : ''
                  } ${!message.is_read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-crm-green-light rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-crm-green font-medium text-sm">
                        {message.sender_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!message.is_read && <Circle size={8} className="text-crm-blue fill-crm-blue" />}
                        <p className={`font-medium truncate ${!message.is_read ? 'text-crm-text-primary' : 'text-crm-text-secondary'}`}>
                          {message.sender_name}
                        </p>
                      </div>
                      <p className={`text-sm truncate ${!message.is_read ? 'font-medium' : ''}`}>{message.subject}</p>
                      <p className="text-xs text-crm-text-secondary truncate">{message.content}</p>
                      <p className="text-xs text-crm-text-muted mt-1">
                        {new Date(message.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 crm-card" data-testid="message-detail">
          {selectedMessage ? (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-crm-border">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-medium mb-1">{selectedMessage.subject}</h2>
                    <div className="flex items-center gap-2 text-sm text-crm-text-secondary">
                      <span>From: {selectedMessage.sender_name}</span>
                      <span>•</span>
                      <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewMessage({
                          recipient_id: '',
                          recipient_name: selectedMessage.sender_name,
                          subject: `Re: ${selectedMessage.subject}`,
                          content: '',
                          message_type: 'internal'
                        });
                        setIsComposeOpen(true);
                      }}
                      className="btn-secondary"
                    >
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="text-crm-danger hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1">
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-crm-text-primary">{selectedMessage.content}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-crm-text-secondary">
              <div className="text-center">
                <Mail size={48} className="mx-auto mb-4 opacity-30" />
                <p>Select a message to read</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
            <DialogDescription>Send a message to a team member.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendMessage} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="label-uppercase">To</Label>
              <Select value={newMessage.recipient_id} onValueChange={(v) => setNewMessage({...newMessage, recipient_id: v})}>
                <SelectTrigger data-testid="recipient-select">
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {team.map(member => (
                    <SelectItem key={member.id} value={member.id}>{member.name} ({member.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="label-uppercase">Subject</Label>
              <Input
                data-testid="message-subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                placeholder="Message subject"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="label-uppercase">Message</Label>
              <textarea
                data-testid="message-content"
                className="flex min-h-[150px] w-full rounded-md border border-crm-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newMessage.content}
                onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                placeholder="Write your message..."
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsComposeOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" data-testid="send-message-btn" className="flex-1 btn-primary">
                <Send size={14} className="mr-2" /> Send Message
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Messages;
