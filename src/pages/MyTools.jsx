import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ToolCard from "../components/shared/ToolCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyTools() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myTools = [], isLoading } = useQuery({
    queryKey: ['myTools', user?.email],
    queryFn: () => base44.entities.Tool.filter({ owner_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const deleteToolMutation = useMutation({
    mutationFn: (toolId) => base44.entities.Tool.delete(toolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTools'] });
      alert('Tool deleted successfully');
    },
  });

  const handleDelete = (toolId) => {
    if (confirm('Are you sure you want to delete this tool?')) {
      deleteToolMutation.mutate(toolId);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              My Tools
            </h1>
            <p className="text-green-200 mt-2">
              Manage your tool listings and earn passive income
            </p>
          </div>
          <Link to={createPageUrl("AddTool")}>
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg">
              <Plus className="w-5 h-5 mr-2" />
              Add New Tool
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-orange-500 bg-green-950/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-sm text-green-200 mb-1">Total Tools</p>
              <p className="text-3xl font-bold text-white">{myTools.length}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-500 bg-green-950/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-sm text-green-200 mb-1">Available</p>
              <p className="text-3xl font-bold text-green-400">
                {myTools.filter(t => t.is_available).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-500 bg-green-950/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-sm text-green-200 mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-400">
                {myTools.reduce((sum, t) => sum + (t.total_bookings || 0), 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tools Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden bg-green-950/50 border-green-700">
                <Skeleton className="h-48 w-full bg-green-800" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4 bg-green-800" />
                  <Skeleton className="h-4 w-full bg-green-800" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : myTools.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-green-700 bg-green-950/30">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold mb-2 text-white">No tools yet</h3>
            <p className="text-green-200 mb-6">
              Start earning by listing your first tool - AI will set fair pricing automatically!
            </p>
            <Link to={createPageUrl("AddTool")}>
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600">
                <Plus className="w-5 h-5 mr-2" />
                List Your First Tool
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTools.map(tool => (
              <div key={tool.id} className="relative group">
                <ToolCard tool={tool} />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to={createPageUrl(`AddTool?id=${tool.id}`)}>
                    <Button size="icon" variant="secondary" className="shadow-lg">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="shadow-lg"
                    onClick={() => handleDelete(tool.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}