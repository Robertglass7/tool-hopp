import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Wrench, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
        const res = await fetch('http://localhost:3001/api/admin/users', {
            headers: { Authorization: `Bearer ${localStorage.getItem('toolhopp_token')}` }
        });
        return res.json();
    }
  });

  const { data: tools = [] } = useQuery({
    queryKey: ['adminTools'],
    queryFn: () => base44.entities.Tool.list()
  });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-10 h-10 text-orange-500" />
          <h1 className="text-3xl font-bold text-white">Admin Control Panel</h1>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-green-900/50 border-green-700">
            <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> Users</TabsTrigger>
            <TabsTrigger value="tools" className="gap-2"><Wrench className="w-4 h-4" /> Tools</TabsTrigger>
            <TabsTrigger value="reports" className="gap-2"><AlertTriangle className="w-4 h-4" /> Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card className="bg-green-950/50 border-green-700">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-green-700">
                      <TableHead className="text-green-300">ID</TableHead>
                      <TableHead className="text-green-300">Name</TableHead>
                      <TableHead className="text-green-300">Email</TableHead>
                      <TableHead className="text-green-300">Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id} className="border-green-700 text-white">
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={user.role === 'admin' ? 'bg-orange-600' : 'bg-green-800'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="mt-6">
            {/* Similar table for tools */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
