import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, Shield, Upload, LogOut, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    phone: '',
    location: '',
    profile_photo: ''
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        location: user.location || '',
        profile_photo: user.profile_photo || ''
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, profile_photo: file_url }));
      updateProfileMutation.mutate({ profile_photo: file_url });
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleDeleteAccount = async () => {
    try {
      await base44.auth.deleteAccount();
      base44.auth.logout();
    } catch (err) {
      console.error('Deletion failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full bg-green-800" />
          <Skeleton className="h-96 w-full bg-green-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            My Profile
          </h1>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 border-green-700 text-white hover:bg-green-800"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="border-2 border-green-700 bg-green-950/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                {formData.profile_photo ? (
                  <img
                    src={formData.profile_photo}
                    alt={user.full_name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-orange-500"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-orange-500">
                    {user.full_name?.[0] || user.email[0].toUpperCase()}
                  </div>
                )}
                {isEditing && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="profile-photo"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="profile-photo"
                      className="absolute bottom-0 right-0 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-white" />
                    </label>
                  </>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2 text-white">{user.full_name || "User"}</h2>
                <p className="text-green-300 mb-3">{user.email}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge variant="outline" className="bg-blue-900/50 text-blue-300 border-blue-600">
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </Badge>
                  {user.is_verified && (
                    <Badge variant="outline" className="bg-green-900/50 text-green-300 border-green-600">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-green-900/50 rounded-lg border border-green-700">
                  <p className="text-2xl font-bold text-orange-400">{user.total_tools_listed || 0}</p>
                  <p className="text-xs text-green-300">Tools Listed</p>
                </div>
                <div className="p-3 bg-green-900/50 rounded-lg border border-green-700">
                  <p className="text-2xl font-bold text-green-400">{user.total_rentals || 0}</p>
                  <p className="text-xs text-green-300">Rentals</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="border-2 border-green-700 bg-green-950/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Profile Information</CardTitle>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-orange-500 to-orange-600">
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  if (user) {
                    setFormData({
                      full_name: user.full_name || '',
                      bio: user.bio || '',
                      phone: user.phone || '',
                      location: user.location || '',
                      profile_photo: user.profile_photo || ''
                    });
                  }
                }}
                className="border-green-700 text-white hover:bg-green-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={updateProfileMutation.isPending}
                  className="bg-gradient-to-r from-orange-500 to-orange-600"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-green-200">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    disabled={!isEditing}
                    className="bg-green-900/50 text-white border-green-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-green-200">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!isEditing}
                    className="bg-green-900/50 text-white border-green-700"
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
                  disabled={!isEditing}
                  className="bg-green-900/50 text-white border-green-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-green-200">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell others about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  disabled={!isEditing}
                  rows={4}
                  className="bg-green-900/50 text-white border-green-700"
                />
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="border-2 border-red-800/60 bg-green-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-green-300 text-sm">
              Permanently delete your ToolHopp account and all associated data. This action cannot be undone.
            </p>
            <Button
              variant="outline"
              className="border-red-700 text-red-400 hover:bg-red-900/30"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete My Account
            </Button>
          </CardContent>
        </Card>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-green-950 border-red-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Delete Account
              </DialogTitle>
              <DialogDescription className="text-green-300">
                This will permanently delete your account, tools, bookings, and all data. Type <strong className="text-white">DELETE</strong> to confirm.
              </DialogDescription>
            </DialogHeader>
            <input
              className="w-full px-3 py-2 rounded-lg bg-green-900 border border-green-700 text-white placeholder:text-green-500 mt-2"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
            <DialogFooter className="gap-2">
              <Button variant="outline" className="border-green-700 text-white hover:bg-green-800" onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(""); }}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteConfirmText !== "DELETE"}
                onClick={handleDeleteAccount}
              >
                Permanently Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-green-700 bg-green-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Star className="w-5 h-5 text-yellow-400" />
                Owner Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  {user.owner_rating > 0 ? user.owner_rating.toFixed(1) : '-'}
                </span>
                <span className="text-green-300">/ 5.0</span>
              </div>
              <p className="text-sm text-green-200 mt-2">
                Based on ratings as a tool owner
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-700 bg-green-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Star className="w-5 h-5 text-yellow-400" />
                Renter Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  {user.renter_rating > 0 ? user.renter_rating.toFixed(1) : '-'}
                </span>
                <span className="text-green-300">/ 5.0</span>
              </div>
              <p className="text-sm text-green-200 mt-2">
                Based on ratings as a renter
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}