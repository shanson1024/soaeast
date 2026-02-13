import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Login = () => {
  const [email, setEmail] = useState('scott@soaeast.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Auto-seed on first load
    const seedDatabase = async () => {
      try {
        setSeeding(true);
        const response = await axios.post(`${API}/seed`);
        if (response.data.seeded) {
          toast.success('Database seeded with sample data');
        }
      } catch (error) {
        console.log('Seed check complete');
      } finally {
        setSeeding(false);
      }
    };
    seedDatabase();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-crm-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-crm-green rounded-2xl mb-4">
            <span className="text-white font-bold text-3xl">S</span>
          </div>
          <p className="label-uppercase mb-1">Promo Products</p>
          <h1 className="font-serif text-4xl text-crm-text-primary">SOA East LLC</h1>
        </div>

        {/* Login Card */}
        <div className="crm-card p-8" data-testid="login-card">
          <h2 className="text-xl font-medium text-center mb-6">Sign in to your account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="label-uppercase">Email</Label>
              <Input
                id="email"
                data-testid="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-white border-crm-border rounded-[10px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="label-uppercase">Password</Label>
              <Input
                id="password"
                data-testid="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-white border-crm-border rounded-[10px]"
                required
              />
            </div>

            <Button
              type="submit"
              data-testid="login-submit"
              className="w-full btn-primary"
              disabled={isLoading || seeding}
            >
              {seeding ? 'Setting up...' : isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-crm-text-secondary mt-6">
            Default: scott@soaeast.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
