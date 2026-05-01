import React, { useState, useEffect } from "react";
import { toolhopp as base44 } from \"@/api/toolhoppClient\";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "../components/shared/MobileSelect";
import { ArrowLeft, Upload, X, Sparkles, DollarSign, Shield, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const categories = [
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
  { value: "excellent", label: "Excellent - Like New" },
  { value: "good", label: "Good - Minor Wear" },
  { value: "fair", label: "Fair - Shows Use" },
  { value: "needs_repair", label: "Needs Repair" },
];

export default function AddTool() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const toolId = urlParams.get('id');
  const isEditing = !!toolId;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'power_tools',
    condition: 'good',
    year: '',
    model_number: '',
    location: '',
    photos: [],
    is_available: true,
    for_sale: false,
  });
  
  const [aiPricing, setAiPricing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: existingTool } = useQuery({
    queryKey: ['tool', toolId],
    queryFn: () => base44.entities.Tool.filter({ id: toolId }, '', 1).then(tools => tools[0]),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingTool) {
      setFormData({
        title: existingTool.title || '',
        description: existingTool.description || '',
        category: existingTool.category || 'power_tools',
        condition: existingTool.condition || 'good',
        year: existingTool.year || '',
        model_number: existingTool.model_number || '',
        location: existingTool.location || '',
        photos: existingTool.photos || [],
        is_available: existingTool.is_available !== false,
        for_sale: existingTool.for_sale || false,
      });
      if (existingTool.price_per_hour) {
        setAiPricing({
          price_per_hour: existingTool.price_per_hour,
          price_per_day: existingTool.price_per_day,
          price_per_week: existingTool.price_per_week,
          buy_now_price: existingTool.buy_now_price,
          insurance_coverage: existingTool.insurance_coverage
        });
      }
    }
  }, [existingTool]);

  const getAIPricingMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional tool appraisal and rental pricing expert for ToolHopp, a peer-to-peer tool rental marketplace.

TOOL SUBMITTED BY OWNER:
- Name/Title: ${formData.title}
- Category: ${formData.category.replace(/_/g, ' ')}
- Condition: ${formData.condition}
- Year / Age: ${formData.year || 'Not specified'}
- Model Number: ${formData.model_number || 'Not specified'}
- Description: ${formData.description || 'No description provided'}

YOUR TASK — follow every step carefully:

STEP 1 — RESEARCH REAL MARKET VALUE:
Look up what this specific tool (brand, model, year if known) sells for NEW on the market today (Home Depot, Amazon, Lowe's, manufacturer websites). If the model is not specified, use the most common mid-range version of that tool type from a reputable brand.

STEP 2 — CALCULATE CURRENT (USED) VALUE based on condition:
- Excellent (like new, barely used): 80-90% of new price
- Good (minor wear, fully functional): 55-70% of new price
- Fair (visible wear, works fine): 35-50% of new price
- Needs repair: 15-30% of new price

This "current_value" is what the tool is actually worth right now. This is also the BUY NOW PRICE for the sale option.

STEP 3 — CALCULATE RENTAL RATES using INVERSE SCALING:
The rental % of value DECREASES as value increases (high-value tools rent at a lower % — this matches real industry practice).

Hourly rate tiers based on current_value:
- $0–$50 value: hourly = 8–10% of current_value
- $51–$150 value: hourly = 5–7% of current_value
- $151–$400 value: hourly = 3–5% of current_value
- $401–$1,000 value: hourly = 2–3% of current_value
- $1,001–$5,000 value: hourly = 1–2% of current_value
- $5,001–$20,000 value: hourly = 0.5–1% of current_value
- $20,001+ value: hourly = 0.2–0.5% of current_value

Condition modifier (apply to hourly rate):
- Excellent: multiply by 1.1
- Good: multiply by 1.0
- Fair: multiply by 0.85
- Needs repair: multiply by 0.6

Daily rate = 6x the hourly rate (capped at a good deal vs buying)
Weekly rate = 3x the daily rate (strong weekly discount)

STEP 4 — DEPOSIT (based on real rental industry benchmarks):
Research how tool rental companies (Home Depot Tool Rental, Sunbelt Rentals, United Rentals) typically set deposits for this type of tool. Generally:
- Tools under $100 current value: deposit = $25–$50
- $100–$300 current value: deposit = $50–$100
- $301–$1,000 current value: deposit = $100–$200
- $1,001–$5,000 current value: deposit = $200–$500
- $5,001–$20,000 current value: deposit = $500–$2,000
- $20,000+ current value: deposit = $2,000–$5,000
Note: Deposit is WAIVED for ToolHopp subscribers — only show it as the standard deposit for non-subscribers.

STEP 5 — INSURANCE COVERAGE:
Set insurance_coverage = new_price_today (full replacement value, not current used value).

STEP 6 — PRICING RATIONALE:
Write a 2-sentence explanation of how you valued this tool and set pricing, mentioning the brand/model research.

Return ONLY a JSON object:
{
  "new_price_researched": number,
  "current_value": number,
  "price_per_hour": number,
  "price_per_day": number,
  "price_per_week": number,
  "buy_now_price": number,
  "deposit_required": number,
  "insurance_coverage": number,
  "pricing_rationale": string
}`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            new_price_researched: { type: "number" },
            current_value: { type: "number" },
            price_per_hour: { type: "number" },
            price_per_day: { type: "number" },
            price_per_week: { type: "number" },
            buy_now_price: { type: "number" },
            deposit_required: { type: "number" },
            insurance_coverage: { type: "number" },
            pricing_rationale: { type: "string" }
          },
          required: ["new_price_researched", "current_value", "price_per_hour", "price_per_day", "price_per_week", "buy_now_price", "deposit_required", "insurance_coverage", "pricing_rationale"]
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setAiPricing(data);
    },
    onError: () => {
      setError('Failed to get AI pricing. Please try again.');
    }
  });

  const createToolMutation = useMutation({
    mutationFn: (toolData) => base44.entities.Tool.create(toolData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTools'] });
      navigate(createPageUrl('MyTools'));
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: ({ id, toolData }) => base44.entities.Tool.update(id, toolData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTools'] });
      queryClient.invalidateQueries({ queryKey: ['tool', toolId] });
      navigate(createPageUrl('MyTools'));
    },
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...urls]
      }));
    } catch (err) {
      setError('Failed to upload images');
    }
    setUploading(false);
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleGetPricing = () => {
    if (!formData.title || !formData.category) {
      setError('Please enter tool name and category first');
      return;
    }
    setError('');
    getAIPricingMutation.mutate();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    if (!aiPricing) {
      setError('Please get AI pricing before listing your tool');
      return;
    }

    const toolData = {
      ...formData,
      owner_email: user.email,
      price_per_hour: aiPricing.price_per_hour,
      price_per_day: aiPricing.price_per_day,
      price_per_week: aiPricing.price_per_week,
      buy_now_price: formData.for_sale ? aiPricing.buy_now_price : null,
      insurance_coverage: aiPricing.insurance_coverage,
      deposit_required: aiPricing.deposit_required,
    };

    if (isEditing) {
      updateToolMutation.mutate({ id: toolId, toolData });
    } else {
      createToolMutation.mutate(toolData);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link to={createPageUrl("MyTools")}>
            <Button variant="outline" className="gap-2 mb-4 border-green-700 text-white hover:bg-green-800">
              <ArrowLeft className="w-4 h-4" />
              Back to My Tools
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {isEditing ? 'Edit Tool' : 'List a New Tool'}
          </h1>
          <p className="text-green-200 mt-2">
            {isEditing ? 'Update your tool details' : 'AI will automatically set fair pricing for your tool'}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="border-2 border-green-700 bg-green-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Tool Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-green-200">Tool Name *</Label>
                <Input
                  id="title"
                  placeholder="e.g., DeWalt Power Drill"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  className="bg-green-900/50 text-white border-green-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-green-200">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your tool, its features, and condition..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="bg-green-900/50 text-white border-green-700"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-green-200">Year / Age (optional)</Label>
                  <Input
                    id="year"
                    placeholder="e.g., 2019"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="bg-green-900/50 text-white border-green-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model_number" className="text-green-200">Model Number (optional)</Label>
                  <Input
                    id="model_number"
                    placeholder="e.g., DCD771C2"
                    value={formData.model_number}
                    onChange={(e) => setFormData({...formData, model_number: e.target.value})}
                    className="bg-green-900/50 text-white border-green-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-green-200">Category *</Label>
                  <MobileSelect
                    value={formData.category}
                    onValueChange={(value) => setFormData({...formData, category: value})}
                    options={categories}
                    placeholder="Select category"
                    triggerClassName="bg-green-900/50 text-white border-green-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-green-200">Condition *</Label>
                  <MobileSelect
                    value={formData.condition}
                    onValueChange={(value) => setFormData({...formData, condition: value})}
                    options={conditions}
                    placeholder="Select condition"
                    triggerClassName="bg-green-900/50 text-white border-green-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-green-200">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Brooklyn, NY"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="bg-green-900/50 text-white border-green-700"
                />
              </div>

              {/* Photos */}
              <div className="space-y-2">
                <Label className="text-green-200">Photos</Label>
                <div className="border-2 border-dashed border-green-700 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto text-green-500 mb-2" />
                    <p className="text-green-200">
                      {uploading ? 'Uploading...' : 'Click to upload photos'}
                    </p>
                    <p className="text-sm text-green-400 mt-1">
                      PNG, JPG up to 10MB
                    </p>
                  </label>
                </div>

                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Tool ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Availability + For Sale */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_available" className="cursor-pointer text-green-200">
                    Tool is currently available for rent
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="for_sale"
                    checked={formData.for_sale}
                    onChange={(e) => setFormData({...formData, for_sale: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="for_sale" className="cursor-pointer text-green-200">
                    Also list this tool for sale (AI will set the buy now price)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Pricing Section */}
          <Card className="border-2 border-purple-500 bg-green-950/50 backdrop-blur-sm mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Tool Appraisal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-green-200 text-sm">
                Our AI researches real market prices for your specific tool (brand, model, age), then sets rental rates using inverse scaling — higher-value tools get a lower rental % — matching professional rental industry standards. Security deposit is set based on actual tool rental benchmarks and is waived for ToolHopp subscribers.
              </p>

              {!aiPricing ? (
                <Button
                  type="button"
                  onClick={handleGetPricing}
                  disabled={getAIPricingMutation.isPending || !formData.title}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                >
                  {getAIPricingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Researching market value & calculating rates...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get AI Pricing
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  {/* AI Rationale */}
                  {aiPricing.pricing_rationale && (
                    <div className="p-3 bg-purple-900/30 rounded-lg border border-purple-600/40 text-sm text-purple-200 italic">
                      💡 {aiPricing.pricing_rationale}
                    </div>
                  )}

                  {/* Value context */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-green-900/30 rounded-lg border border-green-800">
                      <p className="text-green-400">New Retail Value</p>
                      <p className="text-white font-bold">${aiPricing.new_price_researched?.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-green-900/30 rounded-lg border border-green-800">
                      <p className="text-green-400">Current Used Value</p>
                      <p className="text-white font-bold">${aiPricing.current_value?.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Rental rates */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-green-900/50 rounded-lg border border-green-700">
                      <div className="flex items-center gap-1 mb-1">
                        <DollarSign className="w-3 h-3 text-orange-400" />
                        <span className="text-xs text-green-300">Per Hour</span>
                      </div>
                      <p className="text-xl font-bold text-orange-400">${aiPricing.price_per_hour?.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-green-900/50 rounded-lg border border-green-700">
                      <div className="flex items-center gap-1 mb-1">
                        <DollarSign className="w-3 h-3 text-orange-400" />
                        <span className="text-xs text-green-300">Per Day</span>
                      </div>
                      <p className="text-xl font-bold text-orange-400">${aiPricing.price_per_day?.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-green-900/50 rounded-lg border border-green-700">
                      <div className="flex items-center gap-1 mb-1">
                        <DollarSign className="w-3 h-3 text-orange-400" />
                        <span className="text-xs text-green-300">Per Week</span>
                      </div>
                      <p className="text-xl font-bold text-orange-400">${aiPricing.price_per_week?.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Deposit + Insurance */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-yellow-900/30 rounded-lg border border-yellow-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-yellow-300">Security Deposit</span>
                      </div>
                      <p className="text-xl font-bold text-yellow-400">${aiPricing.deposit_required?.toFixed(2)}</p>
                      <p className="text-xs text-yellow-600 mt-1">Waived for subscribers</p>
                    </div>
                    <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-blue-300">Insurance Coverage</span>
                      </div>
                      <p className="text-xl font-bold text-blue-400">${aiPricing.insurance_coverage?.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Buy Now — only shown if owner opted in */}
                  {formData.for_sale && (
                    <div className="p-4 bg-green-800/40 rounded-lg border border-green-500/50">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-300 font-medium">Buy Now Price (Sale Listing)</span>
                      </div>
                      <p className="text-2xl font-bold text-green-400">${aiPricing.buy_now_price?.toFixed(2)}</p>
                      <p className="text-xs text-green-500 mt-1">Based on current used market value</p>
                    </div>
                  )}
                </div>
              )}

              {aiPricing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetPricing}
                  disabled={getAIPricingMutation.isPending}
                  className="w-full border-green-700 text-green-200 hover:bg-green-800"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Re-analyze Pricing
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 pt-6">
            <Link to={createPageUrl("MyTools")} className="flex-1">
              <Button type="button" variant="outline" className="w-full border-green-700 text-white hover:bg-green-800">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              disabled={createToolMutation.isPending || updateToolMutation.isPending || !aiPricing}
            >
              {createToolMutation.isPending || updateToolMutation.isPending
                ? 'Saving...'
                : isEditing ? 'Update Tool' : 'List Tool'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
