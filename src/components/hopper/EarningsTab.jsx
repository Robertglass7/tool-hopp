import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { format } from "date-fns";

export default function EarningsTab({ escrows, tasks, isLoading }) {
  const released = escrows.filter(e => e.status === "released");
  const held = escrows.filter(e => e.status === "held");
  const frozen = escrows.filter(e => e.status === "frozen");

  const totalEarned = released.reduce((sum, e) => sum + (e.hopper_share || 0), 0);
  const pendingEarnings = held.reduce((sum, e) => sum + (e.hopper_share || 0), 0);
  const frozenEarnings = frozen.reduce((sum, e) => sum + (e.hopper_share || 0), 0);

  const statusIcon = { released: CheckCircle2, held: Clock, frozen: Lock };
  const statusColor = { released: "text-green-400", held: "text-yellow-400", frozen: "text-red-400" };
  const statusBg = { released: "bg-green-500/10 border-green-500/30", held: "bg-yellow-500/10 border-yellow-500/30", frozen: "bg-red-500/10 border-red-500/30" };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-950/50 border-green-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-300 text-sm">Total Earned</p>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">${totalEarned.toFixed(2)}</p>
            <p className="text-xs text-green-600 mt-1">{released.length} completed rentals</p>
          </CardContent>
        </Card>

        <Card className="bg-green-950/50 border-green-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-300 text-sm">In Escrow</p>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-yellow-400">${pendingEarnings.toFixed(2)}</p>
            <p className="text-xs text-green-600 mt-1">Released after return confirmation</p>
          </CardContent>
        </Card>

        <Card className="bg-green-950/50 border-green-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-300 text-sm">Frozen (Review)</p>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-red-400">${frozenEarnings.toFixed(2)}</p>
            <p className="text-xs text-green-600 mt-1">Pending admin damage review</p>
          </CardContent>
        </Card>
      </div>

      {/* Split breakdown */}
      <Card className="bg-green-950/50 border-green-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            Revenue Split
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Your Share (Hopper)", pct: 50, color: "bg-green-500" },
            { label: "Tool Owner", pct: 30, color: "bg-blue-500" },
            { label: "ToolHopp Platform", pct: 20, color: "bg-orange-500" },
          ].map(({ label, pct, color }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-200">{label}</span>
                <span className="text-white font-semibold">{pct}%</span>
              </div>
              <div className="h-2 bg-green-900 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Transaction history */}
      <div>
        <h3 className="text-white font-semibold mb-3">Transaction History</h3>
        {escrows.length === 0 ? (
          <Card className="bg-green-950/30 border-green-700 p-6 text-center">
            <p className="text-green-400">No transactions yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {escrows.map(e => {
              const Icon = statusIcon[e.status] || DollarSign;
              return (
                <Card key={e.id} className={`border ${statusBg[e.status] || "bg-green-950/40 border-green-700"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${statusColor[e.status]}`} />
                        <div>
                          <p className="text-white text-sm font-medium">Booking #{e.booking_id?.slice(-6)}</p>
                          <p className="text-green-400 text-xs">
                            {e.released_at ? format(new Date(e.released_at), "MMM d, yyyy") : "Pending"}
                          </p>
                          {e.frozen_reason && <p className="text-red-400 text-xs mt-0.5">{e.frozen_reason}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${statusColor[e.status]}`}>
                          +${(e.hopper_share || 0).toFixed(2)}
                        </p>
                        <p className="text-green-500 text-xs">of ${(e.total_amount || 0).toFixed(2)}</p>
                        <Badge className={`text-xs mt-1 ${statusBg[e.status]}`}>{e.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
