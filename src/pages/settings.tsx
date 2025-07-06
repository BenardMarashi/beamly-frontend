import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Button, Input, Switch, Divider, Textarea, Avatar, Chip } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/theme-context";
import { UserTypeSelector } from "../components/profile/UserTypeSelector";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";


export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    phone: "",
    bio: "",
    photoURL: "",
    location: "",
    skills: [] as string[],
    hourlyRate: 0,
    emailNotifications: true,
    pushNotifications: true,
  });
  const [skillInput, setSkillInput] = useState("");

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
          photoURL: data.photoURL || user.photoURL || "",
          location: data.location || "",
          skills: data.skills || [],
          hourlyRate: data.hourlyRate || 0,
          emailNotifications: data.notifications?.email ?? true,
          pushNotifications: data.notifications?.push ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingPhoto(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `users/${user.uid}/profile-${Date.now()}.jpg`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update Firebase Auth profile
      await updateProfile(user, { photoURL: downloadURL });

      // Update Firestore
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: downloadURL,
        updatedAt: new Date(),
      });

      setProfileData(prev => ({ ...prev, photoURL: downloadURL }));
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload profile picture");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update Firebase Auth display name
      if (profileData.displayName !== user.displayName) {
        await updateProfile(user, { displayName: profileData.displayName });
      }

      // Update Firestore
      await updateDoc(doc(db, "users", user.uid), {
        displayName: profileData.displayName,
        phone: profileData.phone,
        bio: profileData.bio,
        location: profileData.location,
        skills: profileData.skills,
        hourlyRate: profileData.hourlyRate,
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
        [`notifications.${type}`]: value,
        updatedAt: new Date(),
      });
      toast.success("Notification settings updated");
    } catch (error) {
      console.error("Error updating notifications:", error);
      toast.error("Failed to update notification settings");
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !profileData.skills.includes(skillInput.trim())) {
      setProfileData(prev => ({ 
        ...prev, 
        skills: [...prev.skills, skillInput.trim()] 
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setProfileData(prev => ({ 
      ...prev, 
      skills: prev.skills.filter(s => s !== skill) 
    }));
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
        
        {/* Account Type Section */}
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
            
            {/* Profile Picture */}
            <div className="flex items-center gap-6 mb-6">
              <Avatar
                src={profileData.photoURL || `https://ui-avatars.com/api/?name=${profileData.displayName || 'User'}&background=0F43EE&color=fff`}
                className="w-24 h-24"
              />
              <div>
                <input
                  type="file"
                  id="photo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
                <Button
                  color="secondary"
                  variant="flat"
                  onPress={() => document.getElementById('photo-upload')?.click()}
                  isLoading={uploadingPhoto}
                  startContent={!uploadingPhoto && <Icon icon="lucide:camera" />}
                >
                  {uploadingPhoto ? "Uploading..." : "Change Photo"}
                </Button>
                <p className="text-xs text-gray-400 mt-2">Max size: 5MB</p>
              </div>
            </div>
            
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
                  Location
                </label>
                <Input
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  variant="bordered"
                  className="bg-white/10"
                  placeholder="New York, USA"
                  startContent={<Icon icon="lucide:map-pin" className="text-gray-400" />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hourly Rate ($/hr)
                </label>
                <Input
                  type="number"
                  value={profileData.hourlyRate.toString()}
                  onChange={(e) => setProfileData({ ...profileData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  variant="bordered"
                  className="bg-white/10"
                  placeholder="45"
                  startContent={<Icon icon="lucide:dollar-sign" className="text-gray-400" />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Skills
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    variant="bordered"
                    className="bg-white/10"
                    placeholder="Add a skill"
                  />
                  <Button
                    color="secondary"
                    onPress={addSkill}
                    isIconOnly
                  >
                    <Icon icon="lucide:plus" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill) => (
                    <Chip
                      key={skill}
                      onClose={() => removeSkill(skill)}
                      variant="flat"
                      color="secondary"
                    >
                      {skill}
                    </Chip>
                  ))}
                </div>
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
                  minRows={4}
                />
              </div>
            </div>
            
            <Button
              color="secondary"
              size="lg"
              className="w-full mt-6"
              onPress={handleUpdateProfile}
              isLoading={loading}
              isDisabled={loading}
            >
              Save Changes
            </Button>
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
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-white">Email Notifications</h3>
                  <p className="text-sm text-gray-400">Receive updates via email</p>
                </div>
                <Switch
                  isSelected={profileData.emailNotifications}
                  onValueChange={(value) => handleNotificationChange('email', value)}
                  color="secondary"
                />
              </div>
              
              <Divider className="bg-white/10" />
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-white">Push Notifications</h3>
                  <p className="text-sm text-gray-400">Receive push notifications</p>
                </div>
                <Switch
                  isSelected={profileData.pushNotifications}
                  onValueChange={(value) => handleNotificationChange('push', value)}
                  color="secondary"
                />
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Appearance */}
        <Card className="glass-card">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Icon icon="lucide:palette" className="text-beamly-primary" />
              Appearance
            </h2>
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-white">Dark Mode</h3>
                <p className="text-sm text-gray-400">Toggle dark mode theme</p>
              </div>
              <Switch
                isSelected={isDarkMode}
                onValueChange={toggleTheme}
                color="secondary"
              />
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};