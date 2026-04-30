import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check, Truck, Package, DollarSign, Users, ArrowRight, Calculator, Info
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 19.99,
    maxTools: 3,
    features: [
      "Up to 3 tools with Hopper service",
      "Delivery & pickup included",
      "Basic insurance coverage",
      "24/7 support",
      "Monthly earnings reports"
    ],
    color: "orange"
  },
  {
    id: "pro",
    name: "Pro",
    price: 39.99,
    maxTools: 10,
    popular: true,
    features: [
      "Up to 10 tools with Hopper service",
      "Priority delivery & pickup",
      "Enhanced insurance coverage",
      "Dedicated Hopper assignment",
      "Real-time tracking",
      "Weekly earnings reports"
    ],
    color: "purple"
  },
  {
    id: "business",
    name: "Business",
    price: 59.99,
    maxTools: 25,
    features: [
      "Up to 25 tools with Hopper service",
      "Express delivery & pickup",
      "Premium insurance coverage",
      "Multiple Hopper assignments",
      "Priority placement in search",
      "Daily earnings reports",
      "Dedicated account manager"
    ],
    color: "green"
  }
];

// Revenue split explanation
const REVENUE_SPLIT = {
  owner: 35,
  hopper: 40,
  platform: 15,
  insurance: 10
};

export default function HopperSubscription() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcHours, setCalcHours] = useState(8);
  const [calcRate, setCalcRate] = useState(5);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myTools = [] } = useQuery({
    queryKey: ['myTools', user?.email],
    queryFn: () => base44.entities.Tool.filter({ owner_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: existingSubscription } = useQuery({
    queryKey: ['ownerSubscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.OwnerSubscription.filter({
        owner_email: user.email,
        status: 'active'
      }, '-created_date', 1);
      return subs[0] || null;
    },
    enabled: !!user,
  });

  const { data: hoppers = [] } = useQuery({
    queryKey: ['availableHoppers'],
    queryFn: () => base44.entities.Hopper.filter({ status: 'approved' }, '-rating', 10),
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (plan) => {
      const startDate = new Date();
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      // Find available hopper
      const availableHopper = hoppers.find(h => h.current_tools_stored < h.max_tools);

      return base44.entities.OwnerSubscription.create({
        owner_email: user.email,
        plan: plan.id,
        status: 'active',
        monthly_price: plan.price,
        max_tools: plan.maxTools,
        tools_enrolled: [],
        assigned_hopper_email: availableHopper?.user_email || null,
        started_date: startDate.toISOString(),
        next_billing_date: nextBilling.toISOString(),
        includes_delivery: true,
        includes_pickup: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerSubscription'] });
      setShowConfirmDialog(false);
      setSelectedPlan(null);
    },
  });

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowConfirmDialog(true);
  };

  const calculateEarnings = () => {
    const rentalAmount = calcHours * calcRate;
    return {
      total: rentalAmount,
      owner: (rentalAmount * REVENUE_SPLIT.owner / 100).toFixed(2),
      hopper: (rentalAmount * REVENUE_SPLIT.hopper / 100).toFixed(2),
      platform: (rentalAmount * REVENUE_SPLIT.platform / 100).toFixed(2),
      insurance: (rentalAmount * REVENUE_SPLIT.insurance / 100).toFixed(2)
    };
  };

  const earnings = calculateEarnings();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Hopper Service Subscriptions
          </h1>
          <p className="text-green-200 max-w-2xl mx-auto">
            Can't be home to rent out your tools? Let verified Hoppers handle storage, 
            delivery, and pickup for you. Earn passive income while Hoppers do the work!
          </p>
        </div>

        {/* Current Subscription Status */}
        {existingSubscription && (
          <Card className="border-2 border-green-500 bg-green-950/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Active {existingSubscription.plan.charAt(0).toUpperCase() + existingSubscription.plan.slice(1)} Plan
                    </h3>
                    <p className="text-green-300">
                      {existingSubscription.tools_enrolled?.length || 0} of {existingSubscription.max_tools} tools enrolled
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">${existingSubscription.monthly_price}/mo</p>
                  <p className="text-sm text-green-300">
                    Next billing: {new Date(existingSubscription.next_billing_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card className="border-2 border-green-700 bg-green-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-orange-400" />
              How Hopper Service Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-2">1. Drop Off</h4>
                <p className="text-sm text-green-200">Drop your tools at your assigned Hopper's location</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-2">2. Hopper Stores</h4>
                <p className="text-sm text-green-200">Verified Hopper securely stores your tools</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-2">3. Deliver & Collect</h4>
                <p className="text-sm text-green-200">Hopper delivers to renters and retrieves tools</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-2">4. Earn Passive Income</h4>
                <p className="text-sm text-green-200">You earn 35% of every rental automatically</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Split Calculator */}
        <Card className="border-2 border-purple-500 bg-green-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-400" />
              Earnings Calculator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-green-200 text-sm">Rental Hours</label>
                  <Select value={calcHours.toString()} onValueChange={(v) => setCalcHours(parseInt(v))}>
                    <SelectTrigger className="bg-green-900/50 text-white border-green-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 4, 8, 12, 24, 48, 72].map(h => (
                        <SelectItem key={h} value={h.toString()}>{h} hours</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-green-200 text-sm">Hourly Rate ($)</label>
                  <Select value={calcRate.toString()} onValueChange={(v) => setCalcRate(parseInt(v))}>
                    <SelectTrigger className="bg-green-900/50 text-white border-green-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 5, 8, 10, 15, 20, 25, 30].map(r => (
                        <SelectItem key={r} value={r.toString()}>${r}/hr</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-900/50 rounded-lg border border-green-700">
                  <span className="text-green-200">Total Rental</span>
                  <span className="text-xl font-bold text-white">${earnings.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-500/20 rounded-lg border border-orange-500">
                  <span className="text-orange-200">Your Earnings (35%)</span>
                  <span className="text-xl font-bold text-orange-400">${earnings.owner}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-500/20 rounded-lg border border-purple-500">
                  <span className="text-purple-200">Hopper (40%)</span>
                  <span className="font-semibold text-purple-400">${earnings.hopper}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-900/50 rounded-lg border border-green-700">
                  <span className="text-green-200">ToolHopp (15%)</span>
                  <span className="font-semibold text-green-400">${earnings.platform}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-500/20 rounded-lg border border-blue-500">
                  <span className="text-blue-200">Insurance Reserve (10%)</span>
                  <span className="font-semibold text-blue-400">${earnings.insurance}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card 
              key={plan.id}
              className={`border-2 bg-green-950/50 backdrop-blur-sm relative ${
                plan.popular ? 'border-purple-500' : 'border-green-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-green-300">/month</span>
                </div>
                <p className="text-sm text-green-300 mt-2">Up to {plan.maxTools} tools</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-green-200">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={existingSubscription?.plan === plan.id || myTools.length === 0}
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                  }`}
                >
                  {existingSubscription?.plan === plan.id ? 'Current Plan' : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {myTools.length === 0 && (
          <Card className="border-2 border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="p-6 text-center">
              <p className="text-yellow-200 mb-4">
                You need to list tools before subscribing to Hopper service.
              </p>
              <Link to={createPageUrl("AddTool")}>
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600">
                  List Your First Tool
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Become a Hopper CTA */}
        <Card className="border-2 border-orange-500 bg-gradient-to-r from-orange-500/20 to-purple-500/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Want to Become a Hopper?</h3>
                <p className="text-green-200">
                  Earn 40% of every rental by storing tools and handling deliveries in your area.
                </p>
              </div>
              <Link to={createPageUrl("BecomeHopper")}>
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 whitespace-nowrap">
                  Apply Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm {selectedPlan?.name} Plan</DialogTitle>
            <DialogDescription>
              Subscribe to Hopper service for ${selectedPlan?.price}/month
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">What's included:</h4>
              <ul className="space-y-2 text-sm">
                {selectedPlan?.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              You can enroll up to {selectedPlan?.maxTools} tools with verified Hoppers who will 
              handle all storage, delivery, and pickup.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600"
                onClick={() => createSubscriptionMutation.mutate(selectedPlan)}
                disabled={createSubscriptionMutation.isPending}
              >
                {createSubscriptionMutation.isPending ? "Processing..." : "Subscribe Now"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}