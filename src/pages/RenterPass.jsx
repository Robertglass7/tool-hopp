import React from "react";
import { toolhopp as base44 } from \"@/api/toolhoppClient\";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, Zap, RefreshCw, Star, ArrowRight } from "lucide-react";
import { format, addMonths } from "date-fns";

const plans = [
  {
    id: "basic",
    name: "Basic Pass",
    price: 9.99,
    description: "Perfect for occasional renters",
    features: [
      "No security deposits on all rentals",
      "Instant deposit waiver at checkout",
      "24-hour deposit return guarantee",
      "Priority booking approval",
    ],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro Pass",
    price: 19.99,
    description: "For frequent tool renters",
    features: [
      "Everything in Basic",
      "5% discount on all rental rates",
      "Dedicated support line",
      "Free damage waiver on tools under $500",
      "Early access to new tool listings",
    ],
    highlight: true,
  },
];

export default function RenterPass() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["renterSubscription", user?.email],
    queryFn: () =>
      base44.entities.RenterSubscription.filter(
        { renter_email: user.email, status: "active" },
        "-created_date",
        1
      ).then((r) => r[0] || null),
    enabled: !!user,
  });

  const subscribeMutation = useMutation({
    mutationFn: (plan) =>
      base44.entities.RenterSubscription.create({
        renter_email: user.email,
        plan: plan.id,
        monthly_price: plan.price,
        status: "active",
        deposit_waived: true,
        started_date: format(new Date(), "yyyy-MM-dd"),
        next_billing_date: format(addMonths(new Date(), 1), "yyyy-MM-dd"),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["renterSubscription"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      base44.entities.RenterSubscription.update(subscription.id, {
        status: "cancelled",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["renterSubscription"] });
    },
  });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 px-4 py-2 rounded-full">
            <Shield className="w-4 h-4 text-orange-400" />
            <span className="text-orange-300 text-sm font-medium">ToolHopp Pass</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Rent Without Limits</h1>
          <p className="text-green-200 text-lg max-w-xl mx-auto">
            Skip security deposits on every rental. Subscribe once and rent worry-free.
          </p>
        </div>

        {/* Active Subscription Banner */}
        {subscription && (
          <Card className="border-2 border-orange-500 bg-green-950/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-lg">
                        {subscription.plan === "pro" ? "Pro Pass" : "Basic Pass"} Active
                      </h3>
                      <Badge className="bg-orange-500 text-white">Active</Badge>
                    </div>
                    <p className="text-green-300 text-sm">
                      Next billing: {subscription.next_billing_date} · ${subscription.monthly_price}/mo
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? "Cancelling..." : "Cancel Plan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How Deposits Work */}
        <Card className="border-green-700 bg-green-950/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-400" />
              How Security Deposits Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  step: "1",
                  title: "Deposit Held",
                  desc: "A small deposit is charged at booking to protect the tool owner.",
                  color: "text-orange-400",
                },
                {
                  step: "2",
                  title: "Tool Returned",
                  desc: "Once you return the tool and the owner confirms it's in good condition.",
                  color: "text-blue-400",
                },
                {
                  step: "3",
                  title: "Instant Refund",
                  desc: "Your deposit is automatically returned to your account within 24 hours — no waiting, no hassle.",
                  color: "text-green-400",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full bg-green-800 flex items-center justify-center font-bold text-sm flex-shrink-0 ${item.color}`}>
                    {item.step}
                  </div>
                  <div>
                    <p className={`font-semibold ${item.color}`}>{item.title}</p>
                    <p className="text-green-300 text-sm mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-green-900/60 rounded-lg border border-green-700 flex items-start gap-2">
              <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-200 text-sm">
                <span className="font-semibold text-yellow-400">Subscribe to skip deposits entirely.</span> Pass subscribers never pay a deposit — we guarantee the owner, so you don't have to.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        {!subscription && (
          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`border-2 bg-green-950/50 relative ${
                  plan.highlight ? "border-orange-500" : "border-green-700"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white px-4">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                      <p className="text-green-300 text-sm mt-1">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-white">${plan.price}</span>
                      <span className="text-green-300 text-sm">/mo</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-green-200 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.highlight
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                        : "bg-green-700 hover:bg-green-600 text-white"
                    }`}
                    onClick={() => subscribeMutation.mutate(plan)}
                    disabled={subscribeMutation.isPending}
                  >
                    {subscribeMutation.isPending ? "Subscribing..." : (
                      <>Get {plan.name} <ArrowRight className="w-4 h-4 ml-1" /></>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {subscription && (
          <Card className="border-green-700 bg-green-950/50 text-center p-8">
            <Star className="w-12 h-12 text-orange-400 mx-auto mb-3" />
            <h3 className="text-white text-xl font-bold mb-2">You're all set!</h3>
            <p className="text-green-300">
              Your security deposits are waived on all rentals. Happy renting!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
