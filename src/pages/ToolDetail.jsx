import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin, Star, Calendar, Shield,
  ArrowLeft, ShoppingCart, CheckCircle2, Flag
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const categoryLabels = {
  power_tools: "Power Tools",
  hand_tools: "Hand Tools",
  yard_equipment: "Yard Equipment",
  automotive: "Automotive",
  ladders_scaffolding: "Ladders & Scaffolding",
  painting: "Painting",
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  other: "Other"
};

export default function ToolDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const toolId = urlParams.get('id');

  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingData, setBookingData] = useState({
    start_date: '',
    end_date: '',
    rental_type: 'hourly',
    pickup_notes: ''
  });
  const [bookingError, setBookingError] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportData, setReportData] = useState({ reason: '', details: '' });

  const handleReport = async () => {
    try {
      await base44.auth.report({
        toolId: tool.id,
        reportedId: tool.ownerId,
        ...reportData
      });
      setShowReportDialog(false);
      alert('Thank you for reporting. Our team will review this listing.');
    } catch (err) {
      console.error('Report failed:', err);
    }
  };

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: renterSub } = useQuery({
    queryKey: ['renterSubscription', user?.email],
    queryFn: () =>
      base44.entities.RenterSubscription.filter(
        { renter_email: user.email, status: 'active' },
        '-created_date',
        1
      ).then((r) => r[0] || null),
    enabled: !!user,
  });

  const { data: tool, isLoading } = useQuery({
    queryKey: ['tool', toolId],
    queryFn: () => base44.entities.Tool.get(toolId),
    enabled: !!toolId,
  });

  const { data: owner } = useQuery({
    queryKey: ['owner', tool?.ownerId],
    queryFn: () => base44.entities.User.me(), // Mocked for now to avoid owner check
    enabled: !!tool,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['toolReviews', toolId],
    queryFn: () => Promise.resolve([]), // Mocked for now
    enabled: !!toolId,
  });

  const createBookingMutation = useMutation({
    mutationFn: (bookingData) => base44.entities.Booking.create(bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      setShowBookingDialog(false);
      alert('Booking request sent! The owner will review and respond soon.');
      navigate(createPageUrl('Bookings'));
    },
  });

  const calculatePrice = () => {
    if (!bookingData.start_date || !bookingData.end_date || !tool) return 0;
    
    const start = new Date(bookingData.start_date);
    const end = new Date(bookingData.end_date);
    const hours = (end - start) / (1000 * 60 * 60);
    
    if (bookingData.rental_type === 'hourly') {
      return hours * tool.price_per_hour;
    } else if (bookingData.rental_type === 'daily') {
      const days = Math.ceil(hours / 24);
      return days * (tool.price_per_day || tool.price_per_hour * 24);
    } else if (bookingData.rental_type === 'weekly') {
      const weeks = Math.ceil(hours / (24 * 7));
      return weeks * (tool.price_per_week || tool.price_per_day * 7);
    }
  };

  const handleBooking = () => {
    setBookingError('');
    
    if (!bookingData.start_date || !bookingData.end_date) {
      setBookingError('Please select start and end dates');
      return;
    }

    const start = new Date(bookingData.start_date);
    const end = new Date(bookingData.end_date);
    
    if (end <= start) {
      setBookingError('End date must be after start date');
      return;
    }

    const totalPrice = calculatePrice();

    createBookingMutation.mutate({
      tool_id: tool.id,
      tool_title: tool.title,
      renter_email: user.email,
      owner_email: tool.owner_email,
      start_date: bookingData.start_date,
      end_date: bookingData.end_date,
      rental_type: bookingData.rental_type,
      total_price: totalPrice,
      deposit_amount: renterSub ? 0 : (tool.deposit_required || 0),
      pickup_notes: bookingData.pickup_notes,
      status: 'pending'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-96 w-full rounded-xl bg-green-800" />
          <Skeleton className="h-64 w-full bg-green-800" />
        </div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <Card className="p-8 text-center bg-green-950/50 border-green-700">
          <p className="text-green-200">Tool not found</p>
          <Link to={createPageUrl("Browse")}>
            <Button className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600">Back to Browse</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isOwner = user?.email === tool.owner_email;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <Link to={createPageUrl("Browse")}>
          <Button variant="outline" className="gap-2 border-green-700 text-white hover:bg-green-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Browse
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden border-green-700 bg-green-950/50">
              <div className="relative h-96 bg-gray-100">
                {tool.photos && tool.photos.length > 0 ? (
                  <img
                    src={tool.photos[0]}
                    alt={tool.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <span className="text-gray-400 text-6xl">🔧</span>
                  </div>
                )}
                <Badge className="absolute top-4 left-4 bg-white text-gray-800">
                  {categoryLabels[tool.category]}
                </Badge>
                {!tool.is_available && (
                  <Badge className="absolute top-4 right-4 bg-red-500">
                    Unavailable
                  </Badge>
                )}
              </div>
            </Card>

            {/* Tool Details */}
            <Card className="border-green-700 bg-green-950/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2 text-white">{tool.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-green-200">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {tool.location || "Location not set"}
                      </div>
                      {tool.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {tool.rating.toFixed(1)} ({tool.total_bookings} rentals)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2 text-white">Description</h3>
                  <p className="text-green-200">{tool.description || "No description provided"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-green-300 mb-1">Condition</p>
                    <Badge variant="outline" className="capitalize text-green-100 border-green-600">
                      {tool.condition.replace('_', ' ')}
                    </Badge>
                  </div>
                  {tool.insurance_coverage > 0 && (
                    <div>
                      <p className="text-sm text-green-300 mb-1">Insurance Coverage</p>
                      <p className="font-semibold text-blue-400">${tool.insurance_coverage}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card className="border-green-700 bg-green-950/50">
                <CardHeader>
                  <CardTitle className="text-white">Reviews ({reviews.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-green-700 pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {Array(5).fill(0).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-green-700'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-green-300">
                          {review.reviewer_email}
                        </span>
                      </div>
                      <p className="text-green-200">{review.comment}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-red-400 gap-2"
                onClick={() => setShowReportDialog(true)}
              >
                <Flag className="w-4 h-4" />
                Report this listing
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card className="sticky top-4 border-2 border-orange-500 bg-green-950/50">
              <CardHeader>
                <CardTitle className="text-white">AI-Set Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-900/50 rounded-lg border border-green-700">
                    <p className="text-xs text-green-300">Per Hour</p>
                    <p className="text-2xl font-bold text-orange-400">${tool.price_per_hour}</p>
                  </div>
                  <div className="p-3 bg-green-900/50 rounded-lg border border-green-700">
                    <p className="text-xs text-green-300">Per Day</p>
                    <p className="text-2xl font-bold text-orange-400">${tool.price_per_day}</p>
                  </div>
                  {tool.price_per_week && (
                    <div className="p-3 bg-green-900/50 rounded-lg border border-green-700 col-span-2">
                      <p className="text-xs text-green-300">Per Week</p>
                      <p className="text-2xl font-bold text-orange-400">${tool.price_per_week}</p>
                    </div>
                  )}
                </div>

                {tool.buy_now_price && (
                  <div className="p-3 bg-green-900/50 rounded-lg border border-green-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-300">Buy Now</p>
                        <p className="text-2xl font-bold text-green-400">${tool.buy_now_price}</p>
                      </div>
                      <ShoppingCart className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                )}

                {isOwner ? (
                  <Alert className="bg-green-900/50 border-green-700">
                    <AlertDescription className="text-green-200">
                      This is your tool listing
                    </AlertDescription>
                  </Alert>
                ) : tool.is_available ? (
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    onClick={() => setShowBookingDialog(true)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Request to Rent
                  </Button>
                ) : (
                  <Button disabled className="w-full">
                    Currently Unavailable
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Owner Card */}
            {owner && (
              <Card className="border-green-700 bg-green-950/50">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Tool Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    {owner.profile_photo ? (
                      <img
                        src={owner.profile_photo}
                        alt={owner.full_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                        {owner.full_name?.[0] || owner.email[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{owner.full_name || "ToolHop User"}</p>
                      {owner.is_verified && (
                        <Badge variant="outline" className="text-xs bg-green-900 text-green-300 border-green-600">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  {owner.bio && (
                    <p className="text-sm text-green-200 mb-4">{owner.bio}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {owner.owner_rating > 0 && (
                      <div>
                        <p className="text-green-300">Rating</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-white">{owner.owner_rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-green-300">Tools Listed</p>
                      <p className="font-semibold text-white">{owner.total_tools_listed || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request to Rent: {tool.title}</DialogTitle>
            <DialogDescription>
              Choose your rental period and submit a request to the owner
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {bookingError && (
              <Alert variant="destructive">
                <AlertDescription>{bookingError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Rental Type</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={bookingData.rental_type}
                onChange={(e) => setBookingData({...bookingData, rental_type: e.target.value})}
              >
                <option value="hourly">Hourly (${tool.price_per_hour}/hr)</option>
                <option value="daily">Daily (${tool.price_per_day}/day)</option>
                {tool.price_per_week && (
                  <option value="weekly">Weekly (${tool.price_per_week}/week)</option>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Start Date & Time</Label>
              <Input
                type="datetime-local"
                value={bookingData.start_date}
                onChange={(e) => setBookingData({...bookingData, start_date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date & Time</Label>
              <Input
                type="datetime-local"
                value={bookingData.end_date}
                onChange={(e) => setBookingData({...bookingData, end_date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Pickup Notes (optional)</Label>
              <Textarea
                placeholder="Any special instructions or questions..."
                value={bookingData.pickup_notes}
                onChange={(e) => setBookingData({...bookingData, pickup_notes: e.target.value})}
                rows={3}
              />
            </div>

            {/* Deposit info */}
            <div className={`p-3 rounded-lg border text-sm ${renterSub ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
              {renterSub ? (
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ToolHopp Pass active — security deposit waived!
                </div>
              ) : (
                <div className="space-y-1 text-yellow-800">
                  <p className="font-medium">Security Deposit: ${tool.deposit_required?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs">Fully refunded to your account within 24 hours after the tool is returned in good condition.</p>
                  <a href="#" className="text-xs text-orange-600 underline font-medium" onClick={(e) => { e.preventDefault(); setShowBookingDialog(false); window.location.href = '/renter-pass'; }}>
                    Subscribe to skip deposits →
                  </a>
                </div>
              )}
            </div>

            {bookingData.start_date && bookingData.end_date && (
              <div className="p-4 bg-orange-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Rental Price</span>
                  <span className="font-semibold">${calculatePrice().toFixed(2)}</span>
                </div>
                {tool.deposit_required > 0 && !renterSub && (
                  <div className="flex justify-between text-sm text-yellow-700">
                    <span>Security Deposit <span className="text-xs">(refunded within 24hrs)</span></span>
                    <span className="font-semibold">${tool.deposit_required.toFixed(2)}</span>
                  </div>
                )}
                {tool.deposit_required > 0 && renterSub && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Security Deposit</span>
                    <span className="font-semibold line-through opacity-60">${tool.deposit_required.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-orange-200">
                  <span>Total Due</span>
                  <span className="text-orange-600">
                    ${(calculatePrice() + (renterSub ? 0 : (tool.deposit_required || 0))).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowBookingDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600"
                onClick={handleBooking}
                disabled={createBookingMutation.isPending}
              >
                {createBookingMutation.isPending ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="bg-green-950 border-green-700">
          <DialogHeader>
            <DialogTitle className="text-white">Report Listing</DialogTitle>
            <DialogDescription className="text-green-300">
              Help us keep the community safe. Why are you reporting this tool?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-green-200">Reason</Label>
              <select
                className="w-full p-2 rounded-lg bg-green-900 border border-green-700 text-white"
                value={reportData.reason}
                onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
              >
                <option value="">Select a reason</option>
                <option value="misleading">Misleading information</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="safety">Safety concern</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-green-200">Details</Label>
              <Textarea
                className="bg-green-900 border-green-700 text-white"
                placeholder="Please provide more details..."
                value={reportData.details}
                onChange={(e) => setReportData({ ...reportData, details: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1 border-green-700 text-white hover:bg-green-800" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={!reportData.reason}
              onClick={handleReport}
            >
              Submit Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}