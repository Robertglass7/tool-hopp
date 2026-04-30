import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookingCard from "../components/shared/BookingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import PullToRefresh from "../components/shared/PullToRefresh";

export default function Bookings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("as_renter");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: asRenter = [], isLoading: renterLoading, refetch: refetchRenter } = useQuery({
    queryKey: ['bookingsAsRenter', user?.id],
    queryFn: () => base44.entities.Booking.list(), // Simplification: list all for now
    enabled: !!user,
  });

  const { data: asOwner = [], isLoading: ownerLoading, refetch: refetchOwner } = useQuery({
    queryKey: ['bookingsAsOwner', user?.id],
    queryFn: () => base44.entities.Booking.list(), // Simplification
    enabled: !!user,
  });

  const handleRefresh = async () => {
    await Promise.all([refetchRenter(), refetchOwner()]);
  };

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['bookingsAsOwner', user?.id] });
      await queryClient.cancelQueries({ queryKey: ['bookingsAsRenter', user?.id] });
      const prevOwner = queryClient.getQueryData(['bookingsAsOwner', user?.id]);
      const prevRenter = queryClient.getQueryData(['bookingsAsRenter', user?.id]);
      const update = (old = []) => old.map(b => b.id === id ? { ...b, ...data } : b);
      queryClient.setQueryData(['bookingsAsOwner', user?.id], update);
      queryClient.setQueryData(['bookingsAsRenter', user?.id], update);
      return { prevOwner, prevRenter };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevOwner) queryClient.setQueryData(['bookingsAsOwner', user?.id], context.prevOwner);
      if (context?.prevRenter) queryClient.setQueryData(['bookingsAsRenter', user?.id], context.prevRenter);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookingsAsOwner'] });
      queryClient.invalidateQueries({ queryKey: ['bookingsAsRenter'] });
    },
  });

  const handleBookingAction = (bookingId, action) => {
    if (action === 'approve') {
      updateBookingMutation.mutate({ id: bookingId, data: { status: 'approved' } });
    } else if (action === 'decline') {
      updateBookingMutation.mutate({ id: bookingId, data: { status: 'declined' } });
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            My Bookings
          </h1>
          <p className="text-green-200 mt-2">
            Manage your rentals and requests
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-green-900/50">
            <TabsTrigger value="as_renter" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">As Renter</TabsTrigger>
            <TabsTrigger value="as_owner" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">As Owner</TabsTrigger>
          </TabsList>

          <TabsContent value="as_renter" className="space-y-4 mt-6">
            {renterLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="p-6 bg-green-950/50 border-green-700">
                  <Skeleton className="h-32 w-full bg-green-800" />
                </Card>
              ))
            ) : asRenter.length === 0 ? (
              <Card className="p-12 text-center bg-green-950/50 border-green-700">
                <p className="text-green-200">You haven't rented any tools yet</p>
              </Card>
            ) : (
              asRenter.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  userEmail={user?.email}
                  onAction={handleBookingAction}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="as_owner" className="space-y-4 mt-6">
            {ownerLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="p-6 bg-green-950/50 border-green-700">
                  <Skeleton className="h-32 w-full bg-green-800" />
                </Card>
              ))
            ) : asOwner.length === 0 ? (
              <Card className="p-12 text-center bg-green-950/50 border-green-700">
                <p className="text-green-200">No booking requests yet</p>
              </Card>
            ) : (
              asOwner.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  userEmail={user?.email}
                  onAction={handleBookingAction}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </PullToRefresh>
  );
}