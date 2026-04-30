import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  "In Vault": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "On Project": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Pending Pickup": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

export default function VaultSection({ tools, bookings, isLoading }) {
  // Map tools with their current booking status
  const vaultItems = tools.map(tool => {
    const activeBooking = bookings.find(
      b => b.tool_id === tool.id && ["approved", "active"].includes(b.status)
    );
    return {
      ...tool,
      vaultStatus: activeBooking ? "On Project" : "In Vault",
      renterEmail: activeBooking?.renter_email,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-400" />
          My Vault
        </h2>
        <Badge className="bg-green-700 text-green-100">{vaultItems.length} tools</Badge>
      </div>

      {isLoading ? (
        Array(3).fill(0).map((_, i) => (
          <Card key={i} className="bg-green-950/50 border-green-700">
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full bg-green-800" />
            </CardContent>
          </Card>
        ))
      ) : vaultItems.length === 0 ? (
        <Card className="bg-green-950/30 border-green-700 p-8 text-center">
          <Package className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-green-300">No tools in your vault yet.</p>
          <p className="text-green-500 text-sm mt-1">Tools assigned to you will appear here.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vaultItems.map(item => (
            <Card key={item.id} className="bg-green-950/50 border-green-700 hover:border-orange-500/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {item.photos?.[0] ? (
                    <img src={item.photos[0]} alt={item.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-green-800 flex items-center justify-center flex-shrink-0 text-2xl">🔧</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-white truncate">{item.title}</p>
                      <Badge className={`text-xs flex-shrink-0 ${statusColors[item.vaultStatus] || "bg-gray-500/20 text-gray-300"}`}>
                        {item.vaultStatus}
                      </Badge>
                    </div>
                    {item.location && (
                      <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </div>
                    )}
                    {item.renterEmail && (
                      <p className="text-xs text-orange-300 mt-1">Renter: {item.renterEmail}</p>
                    )}
                    <p className="text-xs text-green-500 mt-1 capitalize">{item.condition?.replace("_", " ")} condition</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}