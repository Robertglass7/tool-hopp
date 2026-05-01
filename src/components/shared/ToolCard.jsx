import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const categoryLabels = {
  power_tools: "Power Tools",
  hand_tools: "Hand Tools",
  yard_equipment: "Yard Equipment",
  automotive: "Automotive",
  ladders_scaffolding: "Ladders & Scaffolding",
  painting: "Painting",
  heavy_equipment: "Heavy Equipment",
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  other: "Other"
};

const conditionColors = {
  excellent: "bg-green-100 text-green-800",
  good: "bg-blue-100 text-blue-800",
  fair: "bg-yellow-100 text-yellow-800",
  needs_repair: "bg-red-100 text-red-800"
};

export default function ToolCard({ tool }) {
  return (
    <Link to={createPageUrl(`ToolDetail?id=${tool.id}`)}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-orange-500 bg-green-950/70 backdrop-blur-sm border-green-700">
        <div className="relative h-48 overflow-hidden bg-gray-100">
          {tool.photos && tool.photos.length > 0 ? (
            <img
              src={tool.photos[0]}
              alt={tool.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-gray-400 text-4xl">🔧</span>
            </div>
          )}
          {!tool.is_available && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <Badge className="bg-red-500 text-white">Currently Unavailable</Badge>
            </div>
          )}
          <Badge className="absolute top-3 left-3 bg-white text-gray-800">
            {categoryLabels[tool.category]}
          </Badge>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-2 text-white group-hover:text-orange-400 transition-colors line-clamp-1">
            {tool.title}
          </h3>
          
          <p className="text-sm text-green-200 mb-3 line-clamp-2 h-10">
            {tool.description}
          </p>

          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className={conditionColors[tool.condition]}>
              {tool.condition.replace('_', ' ')}
            </Badge>
            {tool.rating > 0 && (
              <div className="flex items-center gap-1 text-sm text-green-200">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{tool.rating.toFixed(1)}</span>
                <span className="text-gray-400">({tool.total_bookings})</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-green-200 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{tool.location || "Location not set"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-green-700">
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-bold text-orange-500">
                ${tool.price_per_hour}
                <span className="text-sm text-green-300 font-normal">/hr</span>
              </span>
              <div className="text-xs text-green-300 space-y-0.5">
                {tool.price_per_day && <div>${tool.price_per_day}/day</div>}
                {tool.price_per_week && <div>${tool.price_per_week}/week</div>}
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              Rent Now
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
