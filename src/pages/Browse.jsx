import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import MobileSelect from "../components/shared/MobileSelect";
import { Badge } from "@/components/ui/badge";
import ToolCard from "../components/shared/ToolCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import PullToRefresh from "../components/shared/PullToRefresh";

const categories = [
  { value: "all", label: "All Categories" },
  { value: "power_tools", label: "Power Tools" },
  { value: "hand_tools", label: "Hand Tools" },
  { value: "yard_equipment", label: "Yard Equipment" },
  { value: "automotive", label: "Automotive" },
  { value: "ladders_scaffolding", label: "Ladders & Scaffolding" },
  { value: "painting", label: "Painting" },
  { value: "heavy_equipment", label: "Heavy Equipment (Trucks, Tractors, Bobcats)" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "carpentry", label: "Carpentry" },
  { value: "other", label: "Other" },
];

const conditions = [
  { value: "all", label: "All Conditions" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "needs_repair", label: "Needs Repair" },
];

export default function Browse() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("available");

  const { data: tools = [], isLoading, refetch } = useQuery({
    queryKey: ['allTools'],
    queryFn: () => base44.entities.Tool.list(),
  });

  const filteredTools = tools.filter(tool => {
    const matchesSearch = !searchTerm || 
      tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    
    let matchesPrice = true;
    if (priceFilter === "under1") matchesPrice = tool.price_per_hour < 1;
    else if (priceFilter === "under2") matchesPrice = tool.price_per_hour < 2;
    else if (priceFilter === "2to3") matchesPrice = tool.price_per_hour >= 2 && tool.price_per_hour < 3;
    else if (priceFilter === "3to4") matchesPrice = tool.price_per_hour >= 3 && tool.price_per_hour < 4;
    else if (priceFilter === "4to5") matchesPrice = tool.price_per_hour >= 4 && tool.price_per_hour < 5;
    else if (priceFilter === "5to10") matchesPrice = tool.price_per_hour >= 5 && tool.price_per_hour < 10;
    else if (priceFilter === "over10") matchesPrice = tool.price_per_hour >= 10;

    const matchesCondition = selectedCondition === "all" || tool.condition === selectedCondition;
    
    let matchesAvailability = true;
    if (availabilityFilter === "available") matchesAvailability = tool.is_available === true;
    else if (availabilityFilter === "unavailable") matchesAvailability = tool.is_available === false;

    return matchesSearch && matchesCategory && matchesPrice && matchesCondition && matchesAvailability;
  });

  return (
    <PullToRefresh onRefresh={refetch}>
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Browse Tools
          </h1>
          <p className="text-green-200">
            Find the perfect tool for your next project
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="border-2 border-green-700 bg-green-950/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
                <Input
                  placeholder="Search tools by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-2 focus:border-orange-500 bg-green-900/50 text-white placeholder:text-green-400"
                />
              </div>
              
              <MobileSelect
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                options={categories}
                placeholder="Category"
                triggerClassName="w-full md:w-48 h-12 border-2 bg-green-900/50 text-white border-green-700"
              />

              <MobileSelect
                value={priceFilter}
                onValueChange={setPriceFilter}
                options={[
                  { value: "all", label: "All Prices" },
                  { value: "under1", label: "Under $1/hr" },
                  { value: "under2", label: "Under $2/hr" },
                  { value: "2to3", label: "$2-3/hr" },
                  { value: "3to4", label: "$3-4/hr" },
                  { value: "4to5", label: "$4-5/hr" },
                  { value: "5to10", label: "$5-10/hr" },
                  { value: "over10", label: "Above $10/hr" },
                ]}
                placeholder="Price Range"
                triggerClassName="w-full md:w-40 h-12 border-2 bg-green-900/50 text-white border-green-700"
              />

              <MobileSelect
                value={selectedCondition}
                onValueChange={setSelectedCondition}
                options={conditions}
                placeholder="Condition"
                triggerClassName="w-full md:w-40 h-12 border-2 bg-green-900/50 text-white border-green-700"
              />

              <MobileSelect
                value={availabilityFilter}
                onValueChange={setAvailabilityFilter}
                options={[
                  { value: "all", label: "All Tools" },
                  { value: "available", label: "Available Only" },
                  { value: "unavailable", label: "Unavailable" },
                ]}
                placeholder="Availability"
                triggerClassName="w-full md:w-40 h-12 border-2 bg-green-900/50 text-white border-green-700"
              />
            </div>

            {/* Active Filters */}
            {(searchTerm || selectedCategory !== "all" || priceFilter !== "all" || selectedCondition !== "all" || availabilityFilter !== "available") && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-green-700">
                <span className="text-sm text-green-200">Active filters:</span>
                {searchTerm && (
                  <Badge variant="outline" className="bg-green-800 text-green-100 border-green-600">
                    Search: "{searchTerm}"
                  </Badge>
                )}
                {selectedCategory !== "all" && (
                  <Badge variant="outline" className="bg-green-800 text-green-100 border-green-600">
                    {categories.find(c => c.value === selectedCategory)?.label}
                  </Badge>
                )}
                {priceFilter !== "all" && (
                  <Badge variant="outline" className="bg-green-800 text-green-100 border-green-600">
                    {priceFilter === "under1" ? "Under $1/hr" : 
                     priceFilter === "under2" ? "Under $2/hr" : 
                     priceFilter === "2to3" ? "$2-3/hr" : 
                     priceFilter === "3to4" ? "$3-4/hr" : 
                     priceFilter === "4to5" ? "$4-5/hr" : 
                     priceFilter === "5to10" ? "$5-10/hr" : "Above $10/hr"}
                  </Badge>
                )}
                {selectedCondition !== "all" && (
                  <Badge variant="outline" className="bg-green-800 text-green-100 border-green-600">
                    {conditions.find(c => c.value === selectedCondition)?.label}
                  </Badge>
                )}
                {availabilityFilter !== "available" && (
                  <Badge variant="outline" className="bg-green-800 text-green-100 border-green-600">
                    {availabilityFilter === "all" ? "All Availability" : "Unavailable Only"}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setPriceFilter("all");
                    setSelectedCondition("all");
                    setAvailabilityFilter("available");
                  }}
                  className="text-green-400 hover:text-green-300"
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-green-200">
            {isLoading ? "Loading..." : `${filteredTools.length} tools available`}
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(9).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden bg-green-950/50 border-green-700">
                <Skeleton className="h-48 w-full bg-green-800" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4 bg-green-800" />
                  <Skeleton className="h-4 w-full bg-green-800" />
                  <Skeleton className="h-4 w-1/2 bg-green-800" />
                </CardContent>
              </Card>
            ))
          ) : filteredTools.length === 0 ? (
            <Card className="col-span-full p-12 text-center bg-green-950/30 border-green-700">
              <p className="text-green-200 text-lg">
                No tools found matching your criteria. Try adjusting your filters!
              </p>
            </Card>
          ) : (
            filteredTools.map(tool => <ToolCard key={tool.id} tool={tool} />)
          )}
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}