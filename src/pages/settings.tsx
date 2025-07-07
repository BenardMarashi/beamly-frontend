import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Button, Input, Switch, Divider, Textarea, Avatar, Chip, Progress } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/theme-context";
import { AccountTypeDisplay } from "../components/profile/AccountTypeDisplay";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
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
  const [uploadingId, setUploadingId] = useState(false);
  const [idUploadProgress, setIdUploadProgress] = useState(0);
  const [userType, setUserType] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');
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
    idDocumentUrl: "",
    idDocumentUploadedAt: null as any,
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
      console.log("Fetching profile for user:", user.uid);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("Firestore user data:", data);
        
        setUserType(data.userType || null);
        setVerificationStatus(data.verificationStatus || 'unverified');
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
          idDocumentUrl: data.idDocumentUrl || "",
          idDocumentUploadedAt: data.idDocumentUploadedAt || null,
        });
      } else {
        console.log("No Firestore document found for user, creating...");
        // Create initial document if it doesn't exist
        const initialData = {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          userType: "both", // Default
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          profileCompleted: false,
          verificationStatus: "unverified",
          bio: "",
          location: "",
          phone: "",
          skills: [],
          hourlyRate: 0,
          notifications: {
            email: true,
            push: true
          }
        };
        
        await setDoc(doc(db, "users", user.uid), initialData);
        console.log("Created initial user document");
        
        // Fetch again
        await fetchUserProfile();
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

      // Update Firestore - use setDoc with merge to ensure document exists
      await setDoc(doc(db, "users", user.uid), {
        photoURL: downloadURL,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setProfileData(prev => ({ ...prev, photoURL: downloadURL }));
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload profile picture");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleIdUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 10MB for ID documents)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type (images and PDFs)
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error("Please upload an image or PDF file");
      return;
    }

    setUploadingId(true);
    setIdUploadProgress(0);
    
    try {
      // Create a secure path for ID documents
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `id-document-${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, `verification/${user.uid}/${fileName}`);
      
      // Upload with progress tracking
      const uploadTask = uploadBytes(storageRef, file);
      
      // Simulate progress (since uploadBytes doesn't provide progress)
      const progressInterval = setInterval(() => {
        setIdUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
      const snapshot = await uploadTask;
      clearInterval(progressInterval);
      setIdUploadProgress(100);
      
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update Firestore with ID document info
      await setDoc(doc(db, "users", user.uid), {
        idDocumentUrl: downloadURL,
        idDocumentUploadedAt: serverTimestamp(),
        verificationStatus: "pending",
        idDocumentMetadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setProfileData(prev => ({ 
        ...prev, 
        idDocumentUrl: downloadURL,
        idDocumentUploadedAt: new Date()
      }));
      setVerificationStatus('pending');
      
      toast.success("ID document uploaded successfully! Verification pending.");
    } catch (error) {
      console.error("Error uploading ID:", error);
      toast.error("Failed to upload ID document");
    } finally {
      setUploadingId(false);
      setIdUploadProgress(0);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    // Validate required fields
    if (!profileData.displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    
    if (!profileData.bio.trim()) {
      toast.error("Bio is required");
      return;
    }
    
    if (!profileData.location.trim()) {
      toast.error("Location is required");
      return;
    }
    
    if (userType === 'freelancer' || userType === 'both') {
      if (profileData.skills.length === 0) {
        toast.error("Please add at least one skill");
        return;
      }
      if (!profileData.hourlyRate || profileData.hourlyRate <= 0) {
        toast.error("Please set your hourly rate");
        return;
      }
    }
    
    setLoading(true);
    try {
      // Update Firebase Auth display name
      if (profileData.displayName !== user.displayName) {
        await updateProfile(user, { displayName: profileData.displayName });
      }

      // Prepare update data
      const updateData = {
        uid: user.uid,
        email: user.email || "",
        displayName: profileData.displayName.trim(),
        phone: profileData.phone.trim(),
        bio: profileData.bio.trim(),
        location: profileData.location.trim(),
        skills: profileData.skills,
        hourlyRate: Number(profileData.hourlyRate) || 0,
        notifications: {
          email: profileData.emailNotifications,
          push: profileData.pushNotifications,
        },
        updatedAt: serverTimestamp(),
        profileCompleted: true,
        userType: userType || "both",
      };
      
      console.log("Saving profile data:", updateData);
      
      // Use setDoc with merge to ensure all fields are saved
      await setDoc(doc(db, "users", user.uid), updateData, { merge: true });
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (type: 'email' | 'push', value: boolean) => {
    if (!user) return;
    
    const field = type === 'email' ? 'emailNotifications' : 'pushNotifications';
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    try {
      await setDoc(doc(db, "users", user.uid), {
        [`notifications.${type}`]: value,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast.success("Notification settings updated");
    } catch (error) {
      console.error("Error updating notifications:", error);
      toast.error("Failed to update notification settings");
    }
  };

  const addSkill = () => {
    const trimmedSkill = skillInput.trim();
    if (trimmedSkill && !profileData.skills.includes(trimmedSkill)) {
      if (profileData.skills.length >= 10) {
        toast.error("You can add up to 10 skills");
        return;
      }
      setProfileData(prev => ({ 
        ...prev, 
        skills: [...prev.skills, trimmedSkill] 
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

  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case 'verified':
        return <Chip color="success" variant="flat" size="sm" startContent={<Icon icon="lucide:check-circle" />}>Verified</Chip>;
      case 'pending':
        return <Chip color="warning" variant="flat" size="sm" startContent={<Icon icon="lucide:clock" />}>Verification Pending</Chip>;
      default:
        return <Chip color="danger" variant="flat" size="sm" startContent={<Icon icon="lucide:x-circle" />}>Not Verified</Chip>;
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
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <div className="mt-2">{getVerificationBadge()}</div>
          </div>
          <Button
            variant="bordered"
            startContent={<Icon icon="lucide:arrow-left" />}
            onPress={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
        
        {/* Account Type Section */}
        {userType && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Icon icon="lucide:user-cog" className="text-beamly-primary" />
              Account Type
            </h2>
            <AccountTypeDisplay userType={userType} />
          </div>
        )}
        
        {/* ID Verification Section */}
        <Card className="glass-card mb-8 border-primary/20">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Icon icon="lucide:shield-check" className="text-beamly-primary" />
              Identity Verification
            </h2>
            
            <div className="space-y-4">
              <p className="text-gray-300">
                Upload a government-issued ID to verify your identity. This helps build trust with clients and freelancers.
              </p>
              
              {profileData.idDocumentUrl ? (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon icon="lucide:file-check" className="text-success text-2xl" />
                      <div>
                        <p className="text-success font-medium">ID Document Uploaded</p>
                        <p className="text-xs text-gray-400">
                          Uploaded on {profileData.idDocumentUploadedAt ? new Date(profileData.idDocumentUploadedAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="flat"
                      color="success"
                      onPress={() => document.getElementById('id-upload')?.click()}
                    >
                      Replace
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
                  <Icon icon="lucide:upload" className="text-4xl text-primary/50 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">
                    Upload your ID document (image or PDF)
                  </p>
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={() => document.getElementById('id-upload')?.click()}
                    isLoading={uploadingId}
                  >
                    Choose File
                  </Button>
                </div>
              )}
              
              <input
                type="file"
                id="id-upload"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleIdUpload}
                disabled={uploadingId}
              />
              
              {uploadingId && (
                <Progress 
                  value={idUploadProgress} 
                  color="primary" 
                  size="sm"
                  label="Uploading..."
                  showValueLabel
                  className="mt-2"
                />
              )}
              
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Accepted formats: JPG, PNG, PDF (max 10MB)</p>
                <p>• Make sure all information is clearly visible</p>
                <p>• Your ID will be securely stored and only used for verification</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
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
                  Display Name *
                </label>
                <Input
                  value={profileData.displayName}
                  onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                  variant="bordered"
                  className="bg-white/10"
                  placeholder="John Doe"
                  isRequired
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
                  Location *
                </label>
                <Input
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  variant="bordered"
                  className="bg-white/10"
                  placeholder="City, Country"
                  startContent={<Icon icon="lucide:map-pin" className="text-gray-400" />}
                  isRequired
                />
              </div>
              
              {/* Skills - Only show for freelancers */}
              {(userType === 'freelancer' || userType === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Skills * (Max 10)
                  </label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Add a skill"
                      variant="bordered"
                      className="bg-white/10"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button
                      isIconOnly
                      color="secondary"
                      variant="flat"
                      onPress={addSkill}
                      isDisabled={!skillInput.trim() || profileData.skills.length >= 10}
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
              )}
              
              {/* Hourly Rate - Only show for freelancers */}
              {(userType === 'freelancer' || userType === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hourly Rate (USD) *
                  </label>
                  <Input
                    type="number"
                    value={profileData.hourlyRate.toString()}
                    onChange={(e) => setProfileData({ ...profileData, hourlyRate: parseFloat(e.target.value) || 0 })}
                    variant="bordered"
                    className="bg-white/10"
                    placeholder="50"
                    startContent="$"
                    endContent="/hr"
                    min="0"
                    step="1"
                    isRequired
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio *
                </label>
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  variant="bordered"
                  className="bg-white/10"
                  placeholder="Tell us about yourself..."
                  minRows={4}
                  isRequired
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
                  <h3 className="text-white font-medium">Email Notifications</h3>
                  <p className="text-sm text-gray-400">Receive updates via email</p>
                </div>
                <Switch
                  isSelected={profileData.emailNotifications}
                  onValueChange={(value) => handleNotificationChange('email', value)}
                />
              </div>
              
              <Divider className="bg-white/10" />
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-white font-medium">Push Notifications</h3>
                  <p className="text-sm text-gray-400">Receive push notifications</p>
                </div>
                <Switch
                  isSelected={profileData.pushNotifications}
                  onValueChange={(value) => handleNotificationChange('push', value)}
                />
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Theme Settings */}
        <Card className="glass-card mb-8">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Icon icon="lucide:palette" className="text-beamly-primary" />
              Appearance
            </h2>
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-medium">Dark Mode</h3>
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
        <Card className="glass-card border-danger/20">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-danger mb-6 flex items-center gap-2">
              <Icon icon="lucide:alert-triangle" className="text-danger" />
              Danger Zone
            </h2>
            
            <p className="text-gray-400 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            
            <Button
              color="danger"
              variant="flat"
              startContent={<Icon icon="lucide:trash-2" />}
              onPress={() => toast.error("Account deletion is not available in demo mode")}
            >
              Delete Account
            </Button>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};