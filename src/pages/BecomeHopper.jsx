import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, DollarSign, CheckCircle, Clock,
  AlertTriangle, Camera, FileText, MapPin, Package
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const STORAGE_CAPACITIES = [
  { value: "small", label: "Small (1-5 tools)", maxTools: 5 },
  { value: "medium", label: "Medium (6-15 tools)", maxTools: 15 },
  { value: "large", label: "Large (16-30 tools)", maxTools: 30 },
  { value: "warehouse", label: "Warehouse (30+ tools)", maxTools: 100 }
];

const VERIFICATION_STEPS = [
  { id: 1, title: "Personal Info", icon: FileText },
  { id: 2, title: "ID Verification", icon: Shield },
  { id: 3, title: "Selfie Match", icon: Camera },
  { id: 4, title: "Address Proof", icon: MapPin },
  { id: 5, title: "Background Check", icon: CheckCircle }
];

export default function BecomeHopper() {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
    storage_capacity: 'medium',
    id_document_url: '',
    selfie_url: '',
    proof_of_address_url: '',
    payout_method: 'bank_transfer',
    bank_account_last4: ''
  });
  const [error, setError] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: existingApplication, isLoading } = useQuery({
    queryKey: ['hopperApplication', user?.email],
    queryFn: async () => {
      const apps = await base44.entities.Hopper.filter({
        user_email: user.email
      }, '-created_date', 1);
      return apps[0] || null;
    },
    enabled: !!user,
  });

  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const submitApplicationMutation = useMutation({
    mutationFn: () => {
      const capacity = STORAGE_CAPACITIES.find(c => c.value === formData.storage_capacity);
      return base44.entities.Hopper.create({
        user_email: user.email,
        full_name: formData.full_name,
        phone: formData.phone,
        location: formData.location,
        status: 'pending',
        id_document_url: formData.id_document_url,
        selfie_url: formData.selfie_url,
        proof_of_address_url: formData.proof_of_address_url,
        background_check_status: 'pending',
        storage_capacity: formData.storage_capacity,
        max_tools: capacity?.maxTools || 15,
        current_tools_stored: 0,
        payout_method: formData.payout_method,
        bank_account_last4: formData.bank_account_last4
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hopperApplication'] });
    },
  });

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, [field]: file_url }));
    } catch (err) {
      setError('Failed to upload file. Please try again.');
    }
    setUploading(false);
  };

  const canProceedToStep = (step) => {
    switch (step) {
      case 2: return formData.full_name && formData.phone && formData.location;
      case 3: return formData.id_document_url;
      case 4: return formData.selfie_url;
      case 5: return formData.proof_of_address_url;
      default: return true;
    }
  };

  const handleSubmit = () => {
    setError('');
    if (!formData.full_name || !formData.phone || !formData.location) {
      setError('Please complete all required fields');
      return;
    }
    if (!formData.id_document_url || !formData.selfie_url || !formData.proof_of_address_url) {
      setError('Please upload all required verification documents');
      return;
    }
    submitApplicationMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-96 w-full bg-green-800" />
        </div>
      </div>
    );
  }

  // Show application status if already applied
  if (existingApplication) {
    const statusColors = {
      pending: "bg-yellow-500",
      verified: "bg-blue-500",
      approved: "bg-green-500",
      suspended: "bg-red-500",
      rejected: "bg-red-500"
    };

    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-white">Hopper Application Status</h1>
          
          <Card className="border-2 border-green-700 bg-green-950/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 ${statusColors[existingApplication.status]} rounded-full flex items-center justify-center`}>
                  {existingApplication.status === 'approved' ? (
                    <CheckCircle className="w-8 h-8 text-white" />
                  ) : existingApplication.status === 'pending' ? (
                    <Clock className="w-8 h-8 text-white" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white capitalize">
                    {existingApplication.status}
                  </h2>
                  <p className="text-green-200">
                    {existingApplication.status === 'pending' && 'Your application is being reviewed'}
                    {existingApplication.status === 'verified' && 'Documents verified, background check in progress'}
                    {existingApplication.status === 'approved' && 'You are an approved Hopper!'}
                    {existingApplication.status === 'rejected' && 'Your application was not approved'}
                  </p>
                </div>
              </div>

              {existingApplication.status === 'approved' && (
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-green-900/50 rounded-lg border border-green-700 text-center">
                    <Package className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{existingApplication.current_tools_stored}</p>
                    <p className="text-sm text-green-300">Tools Stored</p>
                  </div>
                  <div className="p-4 bg-green-900/50 rounded-lg border border-green-700 text-center">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{existingApplication.total_rentals_handled}</p>
                    <p className="text-sm text-green-300">Rentals Handled</p>
                  </div>
                  <div className="p-4 bg-green-900/50 rounded-lg border border-green-700 text-center">
                    <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">${existingApplication.total_earnings?.toFixed(2) || '0.00'}</p>
                    <p className="text-sm text-green-300">Total Earnings</p>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-green-900/30 rounded-lg border border-green-700">
                <h4 className="font-semibold text-white mb-3">Verification Checklist</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-200">ID Document Uploaded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-200">Selfie Verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-200">Proof of Address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {existingApplication.background_check_status === 'passed' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-400" />
                    )}
                    <span className="text-green-200">
                      Background Check: {existingApplication.background_check_status}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Become a Hopper
          </h1>
          <p className="text-green-200">
            Earn 40% of every rental by storing tools and handling deliveries
          </p>
        </div>

        {/* Earnings Potential */}
        <Card className="border-2 border-orange-500 bg-green-950/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Earning Potential</h3>
                <p className="text-green-200">
                  Hoppers earn <span className="text-orange-400 font-bold">40%</span> of every rental. 
                  Store 10 tools rented 4x monthly at $40 each = <span className="text-green-400 font-bold">$640/month</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <div className="flex justify-between items-center">
          {VERIFICATION_STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex flex-col items-center ${idx > 0 ? 'ml-2' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep > step.id ? 'bg-green-500' :
                  currentStep === step.id ? 'bg-orange-500' : 'bg-green-800'
                }`}>
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-green-300 mt-1 hidden md:block">{step.title}</span>
              </div>
              {idx < VERIFICATION_STEPS.length - 1 && (
                <div className={`w-8 md:w-16 h-1 mx-1 ${currentStep > step.id ? 'bg-green-500' : 'bg-green-800'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Steps */}
        <Card className="border-2 border-green-700 bg-green-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">
              Step {currentStep}: {VERIFICATION_STEPS[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label className="text-green-200">Full Legal Name *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="As shown on your ID"
                    className="bg-green-900/50 text-white border-green-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-200">Phone Number *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                    className="bg-green-900/50 text-white border-green-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-200">Service Location/Address *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Where you'll store and operate from"
                    className="bg-green-900/50 text-white border-green-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-200">Storage Capacity</Label>
                  <Select value={formData.storage_capacity} onValueChange={(v) => setFormData({...formData, storage_capacity: v})}>
                    <SelectTrigger className="bg-green-900/50 text-white border-green-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STORAGE_CAPACITIES.map(cap => (
                        <SelectItem key={cap.value} value={cap.value}>{cap.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-green-200">
                  Upload a clear photo of your government-issued ID (driver's license, passport, or state ID)
                </p>
                <div className="border-2 border-dashed border-green-700 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'id_document_url')}
                    className="hidden"
                    id="id-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="id-upload" className="cursor-pointer">
                    {formData.id_document_url ? (
                      <div className="space-y-2">
                        <img src={formData.id_document_url} alt="ID" className="max-h-48 mx-auto rounded-lg" />
                        <p className="text-green-400">ID Uploaded ✓</p>
                      </div>
                    ) : (
                      <>
                        <Shield className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-green-200">{uploading ? 'Uploading...' : 'Click to upload ID'}</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-green-200">
                  Take a selfie holding your ID next to your face for verification
                </p>
                <div className="border-2 border-dashed border-green-700 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'selfie_url')}
                    className="hidden"
                    id="selfie-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="selfie-upload" className="cursor-pointer">
                    {formData.selfie_url ? (
                      <div className="space-y-2">
                        <img src={formData.selfie_url} alt="Selfie" className="max-h-48 mx-auto rounded-lg" />
                        <p className="text-green-400">Selfie Uploaded ✓</p>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-green-200">{uploading ? 'Uploading...' : 'Click to upload selfie'}</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-green-200">
                  Upload proof of address (utility bill, bank statement, or lease agreement dated within 3 months)
                </p>
                <div className="border-2 border-dashed border-green-700 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'proof_of_address_url')}
                    className="hidden"
                    id="address-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="address-upload" className="cursor-pointer">
                    {formData.proof_of_address_url ? (
                      <div className="space-y-2">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                        <p className="text-green-400">Address Proof Uploaded ✓</p>
                      </div>
                    ) : (
                      <>
                        <MapPin className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-green-200">{uploading ? 'Uploading...' : 'Click to upload document'}</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="p-4 bg-green-900/50 rounded-lg border border-green-700">
                  <h4 className="font-semibold text-white mb-2">Background Check Authorization</h4>
                  <p className="text-sm text-green-200 mb-4">
                    By submitting this application, you authorize ToolHopp to conduct a background check 
                    which may include criminal history, identity verification, and address verification.
                  </p>
                  <div className="space-y-2">
                    <Label className="text-green-200">Payout Method</Label>
                    <Select value={formData.payout_method} onValueChange={(v) => setFormData({...formData, payout_method: v})}>
                      <SelectTrigger className="bg-green-900/50 text-white border-green-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="venmo">Venmo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1 border-green-700 text-white hover:bg-green-800"
                >
                  Back
                </Button>
              )}
              {currentStep < 5 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceedToStep(currentStep + 1)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitApplicationMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600"
                >
                  {submitApplicationMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}