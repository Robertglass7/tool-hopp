import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ClipboardList, DollarSign, ShieldCheck, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import VaultSection from "../components/hopper/VaultSection";
import TasksList from "../components/hopper/TasksList";
import EarningsTab from "../components/hopper/EarningsTab";

export default function HopperDashboard() {
  const [activeTab, setActiveTab] = useState("vault");

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Load hopper profile
  const { data: hopperProfile, isLoading: hopperLoading } = useQuery({
    queryKey: ["hopperProfile", user?.email],
    queryFn: () =>
      base44.entities.Hopper.filter({ user_email: user.email }, "", 1).then(r => r[0] || null),
    enabled: !!user,
  });

  // Load tasks assigned to this hopper
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["hopperTasks", user?.email],
    queryFn: () => base44.entities.HopperTask.filter({ hopper_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  // Load escrow accounts
  const { data: escrows = [], isLoading: escrowsLoading } = useQuery({
    queryKey: ["escrows", user?.email],
    queryFn: () => base44.entities.EscrowAccount.filter({ hopper_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  // Load bookings related to hopper's tasks
  const bookingIds = [...new Set(tasks.map(t => t.booking_id).filter(Boolean))];
  const { data: bookings = [] } = useQuery({
    queryKey: ["hopperBookings", bookingIds.join(",")],
    queryFn: async () => {
      if (!bookingIds.length) return [];
      const results = await Promise.all(
        bookingIds.map(id => base44.entities.Booking.filter({ id }, "", 1).then(r => r[0]).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: bookingIds.length > 0,
  });

  // Load tools currently in the hopper's vault (via owner subscription)
  const { data: ownerSub } = useQuery({
    queryKey: ["ownerSubForHopper", user?.email],
    queryFn: () =>
      base44.entities.OwnerSubscription.filter({ assigned_hopper_email: user.email, status: "active" }, "", 1).then(r => r[0] || null),
    enabled: !!user,
  });

  const enrolledToolIds = ownerSub?.tools_enrolled || [];
  const { data: vaultTools = [], isLoading: toolsLoading } = useQuery({
    queryKey: ["vaultTools", enrolledToolIds.join(",")],
    queryFn: async () => {
      if (!enrolledToolIds.length) return [];
      const results = await Promise.all(
        enrolledToolIds.map(id => base44.entities.Tool.filter({ id }, "", 1).then(r => r[0]).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: enrolledToolIds.length > 0,
  });

  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const frozenEscrows = escrows.filter(e => e.status === "frozen").length;

  if (hopperLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 space-y-4">
        <Skeleton className="h-24 w-full bg-green-800 rounded-xl" />
        <Skeleton className="h-64 w-full bg-green-800 rounded-xl" />
      </div>
    );
  }

  if (!hopperProfile) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <Card className="bg-green-950/50 border-green-700 p-8 text-center max-w-sm">
          <ShieldCheck className="w-14 h-14 text-green-600 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Not a Hopper Yet</h2>
          <p className="text-green-300 text-sm">You need to register as a Hopper to access this dashboard.</p>
        </Card>
      </div>
    );
  }

  const statusColors = {
    approved: "bg-green-500/20 text-green-300",
    pending: "bg-yellow-500/20 text-yellow-300",
    verified: "bg-blue-500/20 text-blue-300",
    suspended: "bg-red-500/20 text-red-300",
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Hopper Dashboard</h1>
            <p className="text-green-300 mt-1">Welcome back, {hopperProfile.full_name}</p>
          </div>
          <Badge className={statusColors[hopperProfile.status] || "bg-gray-500/20 text-gray-300"}>
            {hopperProfile.status}
          </Badge>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-green-950/50 border-green-700">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-white">{vaultTools.length}</p>
              <p className="text-green-400 text-xs mt-1">Tools in Vault</p>
            </CardContent>
          </Card>
          <Card className="bg-green-950/50 border-green-700">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">{pendingTasks}</p>
              <p className="text-green-400 text-xs mt-1">Pending Tasks</p>
            </CardContent>
          </Card>
          <Card className="bg-green-950/50 border-green-700">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                ${escrows.filter(e => e.status === "released").reduce((s, e) => s + (e.hopper_share || 0), 0).toFixed(0)}
              </p>
              <p className="text-green-400 text-xs mt-1">Total Earned</p>
            </CardContent>
          </Card>
          <Card className={`border ${frozenEscrows > 0 ? "bg-red-950/30 border-red-700" : "bg-green-950/50 border-green-700"}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${frozenEscrows > 0 ? "text-red-400" : "text-white"}`}>{frozenEscrows}</p>
              <p className="text-green-400 text-xs mt-1">Frozen Payouts</p>
            </CardContent>
          </Card>
        </div>

        {/* Damage alert banner */}
        {frozenEscrows > 0 && (
          <Card className="bg-red-950/30 border-red-700">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">
                <strong>{frozenEscrows}</strong> payout{frozenEscrows > 1 ? "s" : ""} frozen due to reported damage. Admin review in progress.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-green-900/50">
            <TabsTrigger value="vault" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-1.5">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Vault</span>
              {vaultTools.length > 0 && <Badge className="bg-white/20 text-white text-xs ml-1">{vaultTools.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-1.5">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Tasks</span>
              {pendingTasks > 0 && <Badge className="bg-orange-600 text-white text-xs ml-1">{pendingTasks}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="earnings" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Earnings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vault" className="mt-6">
            <VaultSection
              tools={vaultTools}
              bookings={bookings}
              isLoading={toolsLoading}
            />
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <TasksList
              tasks={tasks}
              escrows={escrows}
              isLoading={tasksLoading}
              userEmail={user?.email}
            />
          </TabsContent>

          <TabsContent value="earnings" className="mt-6">
            <EarningsTab
              escrows={escrows}
              tasks={tasks}
              isLoading={escrowsLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}