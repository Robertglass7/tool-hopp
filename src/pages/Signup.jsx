import React, { useState } from 'react';
import { toolhopp as base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Signup() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.signup(formData);
      await checkUserAuth();
      navigate(createPageUrl('Browse'));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sign up');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-2 border-green-700 bg-green-950/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-white">Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-green-200">Full Name</Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-green-900/50 text-white border-green-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-green-200">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-green-900/50 text-white border-green-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-green-200">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-green-900/50 text-white border-green-700"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 font-bold"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
            <p className="text-center text-green-300 text-sm">
              Already have an account?{' '}
              <Link to="/Login" className="text-orange-400 hover:underline font-bold">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
