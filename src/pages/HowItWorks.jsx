import React, { useState } from "react";
import { toolhopp as base44 } from \"@/api/toolhoppClient\";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play, Search, Wrench, DollarSign, Truck, Shield,
  Users, Sparkles, ArrowRight, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const BENEFITS = [
  {
    icon: DollarSign,
    title: "Save Money",
    description: "Rent tools for a fraction of the purchase price. Why buy when you can rent?",
    color: "green"
  },
  {
    icon: Wrench,
    title: "Access Any Tool",
    description: "Find any tool you need, from power drills to lawn equipment, all in one place.",
    color: "orange"
  },
  {
    icon: Truck,
    title: "Hopper Delivery",
    description: "Verified Hoppers deliver and pick up tools for you. No hassle, no travel.",
    color: "purple"
  },
  {
    icon: Shield,
    title: "Fully Insured",
    description: "Every rental is protected with 10% insurance coverage. Rent with confidence.",
    color: "blue"
  },
  {
    icon: Users,
    title: "Earn Passive Income",
    description: "List your tools and earn 35% of every rental. Hoppers do all the work.",
    color: "green"
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    description: "Free AI assistant helps renters use tools and owners price them fairly.",
    color: "purple"
  }
];

const STEPS_RENTER = [
  { step: 1, title: "Search for Tools", desc: "Browse thousands of tools in your area by keyword or category" },
  { step: 2, title: "Request to Rent", desc: "Select dates, rental type (hourly/daily), and submit booking request" },
  { step: 3, title: "Get Delivered", desc: "Approved Hopper delivers the tool right to your doorstep" },
  { step: 4, title: "Use & Return", desc: "Use the tool for your project, Hopper picks it up when done" }
];

const STEPS_OWNER = [
  { step: 1, title: "List Your Tools", desc: "Add photos and details. AI automatically sets fair pricing" },
  { step: 2, title: "Choose Hopper Service", desc: "Subscribe to let verified Hoppers handle storage & delivery" },
  { step: 3, title: "Drop Off Tools", desc: "Bring your tools to your assigned Hopper's secure location" },
  { step: 4, title: "Earn Automatically", desc: "Receive 35% of every rental. Hoppers do all the work!" }
];

const PRICING_BREAKDOWN = [
  { label: "Owner Earnings", percent: 35, color: "text-orange-400", desc: "Passive income for tool owners" },
  { label: "Hopper Earnings", percent: 40, color: "text-purple-400", desc: "For storage, delivery & pickup" },
  { label: "Platform Fee", percent: 15, color: "text-green-400", desc: "ToolHopp service fee" },
  { label: "Insurance Reserve", percent: 10, color: "text-blue-400", desc: "Damage protection coverage" }
];

export default function HowItWorks() {
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  const generateVideoMutation = useMutation({
    mutationFn: async () => {
      // Generate a promotional image using AI
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Create a vibrant promotional banner for ToolHopp, a peer-to-peer tool rental platform. 
        Show diverse people exchanging tools, power tools like drills and saws, lawn equipment, 
        delivery trucks, and money symbols. Modern, friendly, professional style with green and orange colors.
        Include concepts: sharing economy, community, trust, convenience. Photorealistic, high quality.`
      });
      return result.url;
    },
    onSuccess: (url) => {
      setVideoUrl(url);
      setGeneratingVideo(false);
    }
  });

  const handleGenerateVideo = () => {
    setGeneratingVideo(true);
    generateVideoMutation.mutate();
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            How ToolHopp Works
          </h1>
          <p className="text-green-200 text-lg max-w-3xl mx-auto">
            The easiest way to rent tools, earn money, and save on projects. 
            Watch how our platform connects tool owners with renters through verified Hoppers.
          </p>
        </div>

        {/* AI Video Generator */}
        <Card className="border-2 border-purple-500 bg-gradient-to-r from-purple-500/20 to-orange-500/20 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            {!videoUrl ? (
              <>
                <Play className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-3">
                  Watch Our AI-Generated Explainer
                </h3>
                <p className="text-green-200 mb-6">
                  See ToolHopp in action with a custom AI-generated visual walkthrough
                </p>
                <Button
                  onClick={handleGenerateVideo}
                  disabled={generatingVideo}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-lg px-8 py-6"
                >
                  {generatingVideo ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Visual...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Explainer Video
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <img
                  src={videoUrl}
                  alt="ToolHopp Explainer"
                  className="w-full max-h-96 object-cover rounded-lg shadow-xl"
                />
                <Button
                  onClick={() => {
                    setVideoUrl(null);
                    handleGenerateVideo();
                  }}
                  variant="outline"
                  className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate New Visual
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Benefits */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Why Choose ToolHopp?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, idx) => (
              <Card key={idx} className="border-2 border-green-700 bg-green-950/50 backdrop-blur-sm hover:border-orange-500 transition-all">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-${benefit.color}-500 to-${benefit.color}-600 rounded-full flex items-center justify-center`}>
                    <benefit.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                  <p className="text-green-200">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How to Rent */}
        <Card className="border-2 border-orange-500 bg-green-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-2xl flex items-center gap-2">
              <Search className="w-6 h-6 text-orange-400" />
              How to Rent Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {STEPS_RENTER.map((item) => (
                <div key={item.step} className="relative">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-white mb-2">{item.title}</h4>
                    <p className="text-sm text-green-200">{item.desc}</p>
                  </div>
                  {item.step < 4 && (
                    <ArrowRight className="hidden md:block absolute top-6 -right-8 w-6 h-6 text-orange-400" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to={createPageUrl("Browse")}>
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg px-8 py-6">
                  Start Renting Tools <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* How to Earn */}
        <Card className="border-2 border-green-500 bg-green-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-2xl flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-400" />
              How to Earn with Your Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {STEPS_OWNER.map((item) => (
                <div key={item.step} className="relative">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-white mb-2">{item.title}</h4>
                    <p className="text-sm text-green-200">{item.desc}</p>
                  </div>
                  {item.step < 4 && (
                    <ArrowRight className="hidden md:block absolute top-6 -right-8 w-6 h-6 text-green-400" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to={createPageUrl("AddTool")}>
                <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-lg px-8 py-6">
                  List Your First Tool <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Split */}
        <Card className="border-2 border-purple-500 bg-green-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-2xl">
              Fair & Transparent Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-200 mb-6">
              Every rental is split fairly between owners, Hoppers, platform, and insurance:
            </p>
            <div className="grid md:grid-cols-4 gap-6">
              {PRICING_BREAKDOWN.map((item, idx) => (
                <div key={idx} className="text-center p-4 bg-green-900/50 rounded-lg border border-green-700">
                  <p className="text-sm text-green-300 mb-1">{item.label}</p>
                  <p className={`text-4xl font-bold ${item.color} mb-2`}>{item.percent}%</p>
                  <p className="text-xs text-green-400">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-orange-500/20 rounded-lg border border-orange-500 text-center">
              <p className="text-orange-200">
                <strong>Example:</strong> A tool rented for $100 → Owner gets <span className="text-orange-400 font-bold">$35</span>, 
                Hopper gets <span className="text-purple-400 font-bold">$40</span>, with <span className="text-blue-400 font-bold">$10</span> insurance protection.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-orange-500 bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Wrench className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">
                Need a Tool?
              </h3>
              <p className="text-green-200 mb-6">
                Browse thousands of tools available for rent in your area
              </p>
              <Link to={createPageUrl("Browse")}>
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 w-full">
                  Browse Tools
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-500 bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <DollarSign className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">
                Have Tools?
              </h3>
              <p className="text-green-200 mb-6">
                List your tools and start earning passive income today
              </p>
              <Link to={createPageUrl("AddTool")}>
                <Button className="bg-gradient-to-r from-green-500 to-green-600 w-full">
                  List Your Tools
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
