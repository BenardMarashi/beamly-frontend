// File path: src/pages/settings.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Button, Input, Switch, Divider, Textarea } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/theme-context";
import { UserTypeSelector } from "../components/profile/UserTypeSelector";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    phone: "",
    bio: "",
    emailNotifications: true,
    pushNotifications: true,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserProfile();
  }, [user, navigate]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileData({
          displayName: data.displayName || user.displayName || "",
          email: user.email || "",
          phone: data.phone || "",
          bio: data.bio || "",
          emailNotifications: data.emailNotifications ?? true,
          pushNotifications: data.pushNotifications ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: profileData.displayName,
        phone: profileData.phone,
        bio: profileData.bio,
        updatedAt: new Date(),
      });
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (type: 'email' | 'push', value: boolean) => {
    if (!user) return;
    
    const field = type === 'email' ? 'emailNotifications' : 'pushNotifications';
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    try {
      await updateDoc(doc(db, "users", user.uid), {
        [field]: value,
        updatedAt: new Date(),
      });
      toast.success("Notification settings updated");
    } catch (error) {
      console.error("Error updating notifications:", error);
      toast.error("Failed to update notification settings");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <Button
            variant="bordered"
            startContent={<Icon icon="lucide:arrow-left" />}
            onPress={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
        
        {/* Account Type Section - IMPORTANT FOR JOB POSTING */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Icon icon="lucide:user-cog" className="text-beamly-primary" />
            Account Settings
          </h2>
          <UserTypeSelector />
        </div>
        
        {/* Profile Information */}
        <Card className="glass-card mb-8">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Icon icon="lucide:user" className="text-beamly-primary" />
              Profile Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <Input
                  value={profileData.displayName}
                  onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                  variant="bordered"
                  className="bg-white/10"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <Input
                  value={profileData.email}
                  variant="bordered"
                  className="bg-white/10"
                  isReadOnly
                  isDisabled
                  startContent={<Icon icon="lucide:mail" className="text-gray-400" />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <Input
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  variant="bordered"
                  className="bg-white/10"
                  placeholder="+1 (555) 123-4567"
                  startContent={<Icon icon="lucide:phone" className="text-gray-400" />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  variant="bordered"
                  className="bg-white/10"
                  placeholder="Tell us about yourself..."
                  minRows={3}
                />
              </div>
              
              <Button
                color="secondary"
                onPress={handleUpdateProfile}
                isLoading={loading}
                className="w-full"
                startContent={<Icon icon="lucide:save" />}
              >
                Update Profile
              </Button>
            </div>
          </CardBody>
        </Card>
        
        {/* Notifications */}
        <Card className="glass-card mb-8">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Icon icon="lucide:bell" className="text-beamly-primary" />
              Notifications
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Email Notifications</p>
                  <p className="text-sm text-gray-400">Receive updates via email</p>
                </div>
                <Switch
                  isSelected={profileData.emailNotifications}
                  onValueChange={(value) => handleNotificationChange('email', value)}
                />
              </div>
              
              <Divider className="bg-gray-700" />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Push Notifications</p>
                  <p className="text-sm text-gray-400">Receive browser notifications</p>
                </div>
                <Switch
                  isSelected={profileData.pushNotifications}
                  onValueChange={(value) => handleNotificationChange('push', value)}
                />
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Appearance */}
        <Card className="glass-card mb-8">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Icon icon="lucide:palette" className="text-beamly-primary" />
              Appearance
            </h2>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Dark Mode</p>
                <p className="text-sm text-gray-400">Toggle dark/light theme</p>
              </div>
              <Switch
                isSelected={isDarkMode}
                onValueChange={toggleTheme}
              />
            </div>
          </CardBody>
        </Card>
        
        {/* Danger Zone */}
        <Card className="glass-card border border-red-500/20">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-red-500 mb-6 flex items-center gap-2">
              <Icon icon="lucide:alert-triangle" />
              Danger Zone
            </h2>
            
            <div className="space-y-4">
              <p className="text-gray-300">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button
                color="danger"
                variant="bordered"
                startContent={<Icon icon="lucide:trash-2" />}
              >
                Delete Account
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default SettingsPage;