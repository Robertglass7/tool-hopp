import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, MessageSquare, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import RenterReturnForm from "./RenterReturnForm";

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500",
  approved: "bg-green-500/20 text-green-300 border-green-500",
  declined: "bg-red-500/20 text-red-300 border-red-500",
  active: "bg-blue-500/20 text-blue-300 border-blue-500",
  pending_return: "bg-purple-500/20 text-purple-300 border-purple-500",
  completed: "bg-gray-500/20 text-gray-300 border-gray-500",
  cancelled: "bg-red-500/20 text-red-300 border-red-500"
};

export default function BookingCard({ booking, userEmail, onAction }) {
  const [showReturnForm, setShowReturnForm] = useState(false);
  const isOwner = booking.owner_email === userEmail;
  const isRenter = booking.renter_email === userEmail;
  const isPending = booking.status === 'pending';

  return (
    <Card className="border-2 border-green-700 bg-green-950/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-bold text-white">{booking.tool_title}</h3>
              <Badge variant="outline" className={statusColors[booking.status]}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2 text-green-200">
                <Calendar className="w-4 h-4 text-green-400" />
                <span>{format(new Date(booking.start_date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-green-200">
                <Clock className="w-4 h-4 text-green-400" />
                <span className="capitalize">{booking.rental_type}</span>
              </div>
              <div className="flex items-center gap-2 text-green-200">
                <DollarSign className="w-4 h-4 text-orange-400" />
                <span className="font-semibold text-orange-400">${booking.total_price.toFixed(2)}</span>
              </div>
              <div className="text-green-300">
                {isOwner ? `Renter: ${booking.renter_email}` : `Owner: ${booking.owner_email}`}
              </div>
            </div>

            {booking.pickup_notes && (
              <p className="mt-3 text-sm text-green-300 bg-green-900/50 p-3 rounded-lg border border-green-700">
                <span className="font-semibold">Notes:</span> {booking.pickup_notes}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {isOwner && isPending && (
              <>
                <Button
                  onClick={() => onAction(booking.id, 'approve')}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onAction(booking.id, 'decline')}
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  Decline
                </Button>
              </>
            )}

            {(booking.status === 'approved' || booking.status === 'active') && (
              <Link to={createPageUrl(`Messages`)}>
                <Button variant="outline" className="w-full border-green-600 text-green-300 hover:bg-green-800">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </Link>
            )}

            {isRenter && booking.status === 'active' && (
              <Button
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                onClick={() => setShowReturnForm(true)}
              >
                <PackageCheck className="w-4 h-4 mr-2" />
                Ready to Return
              </Button>
            )}

            {booking.status === 'pending_return' && (
              <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-center px-3 py-2">
                📦 Awaiting Hopper Pickup
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      {showReturnForm && (
        <RenterReturnForm
          booking={booking}
          onClose={() => setShowReturnForm(false)}
        />
      )}
    </Card>
  );
}