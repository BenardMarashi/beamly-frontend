import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardBody, 
  Button, 
  Input, 
  Textarea, 
  Select, 
  SelectItem, 
  Chip, 
  Avatar, 
  Switch 
} from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { VerificationSection } from '../../components/profile/VerificationSection';
import { ImageCropper } from '../../components/ImageCropper';
import { StripeConnectOnboarding } from '../../components/payments/StripeConnectOnboarding';

export const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Image cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>('');
  
  type ExperienceLevel = 'entry' | 'intermediate' | 'expert';
  
  const [profileData, setProfileData] = useState({
    displayName: userData?.displayName || '',
    bio: userData?.bio || '',
    skills: userData?.skills || [],
    hourlyRate: userData?.hourlyRate || 0,
    languages: userData?.languages || ['English'],
    experienceLevel: (userData?.experienceLevel || 'intermediate') as ExperienceLevel,
    experience: userData?.experience || '',
    companyName: userData?.companyName || '',
    industry: userData?.industry || '',
    isAvailable: userData?.isAvailable ?? true,
    photoURL: userData?.photoURL || ''
  });
  
  const [skillInput, setSkillInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  
  const experienceLevels = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'intermediate', label: 'Intermediate (2-5 years)' },
    { value: 'expert', label: 'Expert (5+ years)' }
  ];
  
  const industries = [
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'design', label: 'Design' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'other', label: 'Other' }
  ];
  
  const showFreelancerFields = userData?.userType === 'freelancer' || userData?.userType === 'both';
  const showClientFields = userData?.userType === 'client' || userData?.userType === 'both';
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Create temporary URL for cropping
    const imageUrl = URL.createObjectURL(file);
    setTempImageUrl(imageUrl);
    setShowCropper(true);
  };
  
  const handleCroppedImage = async (croppedBlob: Blob) => {
    if (!user) return;
    
    setUploadingPhoto(true);
    
    try {
      // Create a File from the Blob
      const file = new File([croppedBlob], 'profile-photo.jpg', { type: 'image/jpeg' });
      
      // Create the storage reference
      const timestamp = Date.now();
      const fileName = `profile_${timestamp}.jpg`;
      const storageRef = ref(storage, `profile-photos/${user.uid}/${fileName}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update local state
      setProfileData({ ...profileData, photoURL: downloadURL });
      
      // Update in Firestore immediately
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: downloadURL,
        updatedAt: serverTimestamp()
      });
      
      toast.success('Photo uploaded successfully!');
      
      // Clean up
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl('');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      
      if (error.code === 'storage/unauthorized') {
        toast.error('Permission denied. Please check Firebase Storage rules.');
      } else if (error.code === 'storage/canceled') {
        toast.error('Upload was cancelled');
      } else {
        toast.error('Failed to upload photo. Please try again.');
      }
    } finally {
      setUploadingPhoto(false);
    }
  };
  
  const handleAddSkill = () => {
    if (skillInput.trim() && profileData.skills.length < 15) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, skillInput.trim()]
      });
      setSkillInput('');
    } else if (profileData.skills.length >= 15) {
      toast.error('Maximum 15 skills allowed');
    }
  };
  
  const handleRemoveSkill = (skillToRemove: string) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter(skill => skill !== skillToRemove)
    });
  };
  
  const handleAddLanguage = () => {
    if (languageInput.trim() && profileData.languages.length < 5) {
      setProfileData({
        ...profileData,
        languages: [...profileData.languages, languageInput.trim()]
      });
      setLanguageInput('');
    } else if (profileData.languages.length >= 5) {
      toast.error('Maximum 5 languages allowed');
    }
  };
  
  const handleRemoveLanguage = (languageToRemove: string) => {
    if (profileData.languages.length > 1) {
      setProfileData({
        ...profileData,
        languages: profileData.languages.filter(lang => lang !== languageToRemove)
      });
    } else {
      toast.error('At least one language is required');
    }
  };
  
  const validateProfile = () => {
    if (!profileData.displayName.trim()) {
      toast.error('Display name is required');
      return false;
    }
    
    if (!profileData.bio.trim()) {
      toast.error('Bio is required');
      return false;
    }
    
    if ((userData?.userType === 'freelancer' || userData?.userType === 'both') && profileData.skills.length === 0) {
      toast.error('Please add at least one skill');
      return false;
    }
    
    if ((userData?.userType === 'freelancer' || userData?.userType === 'both') && profileData.hourlyRate <= 0) {
      toast.error('Please set a valid hourly rate');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    if (!user || !validateProfile()) return;
    
    setLoading(true);
    
    try {
      const updateData: any = {
        displayName: profileData.displayName.trim(),
        bio: profileData.bio.trim(),
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        profileCompleted: true
      };
      
      // Add freelancer-specific fields
      if (showFreelancerFields) {
        updateData.skills = profileData.skills;
        updateData.hourlyRate = Number(profileData.hourlyRate);
        updateData.languages = profileData.languages;
        updateData.experienceLevel = profileData.experienceLevel;
        updateData.experience = profileData.experience.trim();
        updateData.isAvailable = profileData.isAvailable;
      }
      
      // Add client-specific fields
      if (showClientFields) {
        updateData.companyName = profileData.companyName.trim();
        updateData.industry = profileData.industry;
      }
      
      await updateDoc(doc(db, 'users', user.uid), updateData);
      
      toast.success('Profile updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-mesh">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto max-w-4xl px-4 py-8"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Edit Profile</h1>
          <p className="text-gray-400">Update your profile information</p>
        </div>
        
        <div className="space-y-6">
          {/* Profile Photo */}
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Profile Photo</h2>
              <div className="flex items-center gap-6">
                <Avatar
                  src={profileData.photoURL || `https://ui-avatars.com/api/?name=${profileData.displayName}&background=FCE90D&color=011241`}
                  className="w-24 h-24"
                />
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploadingPhoto}
                  />
                  <label htmlFor="photo-upload">
                    <Button
                      as="span"
                      color="secondary"
                      variant="flat"
                      isLoading={uploadingPhoto}
                      disabled={uploadingPhoto}
                      startContent={!uploadingPhoto && <Icon icon="lucide:camera" />}
                    >
                      {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                    </Button>
                  </label>
                  <p className="text-gray-400 text-sm mt-2">
                    JPG, PNG or GIF. Max size 5MB
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Basic Information */}
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
              <div className="space-y-4">
                <Input
                  label="Display Name *"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                  variant="bordered"
                  isRequired
                />
                
                <Textarea
                  label="Bio *"
                  placeholder="Tell others about yourself..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  variant="bordered"
                  minRows={4}
                  maxRows={8}
                  isRequired
                />
              </div>
            </CardBody>
          </Card>
          
          {/* Freelancer-specific fields */}
          {showFreelancerFields && (
            <>
              <Card className="glass-effect border-none">
                <CardBody className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Professional Details</h2>
                  <div className="space-y-4">
                    {/* Skills */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Skills * (Max 15)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Add a skill..."
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                          variant="bordered"
                          size="sm"
                        />
                        <Button
                          color="secondary"
                          size="sm"
                          onPress={handleAddSkill}
                          isIconOnly
                        >
                          <Icon icon="lucide:plus" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profileData.skills.map((skill) => (
                          <Chip
                            key={skill}
                            onClose={() => handleRemoveSkill(skill)}
                            variant="flat"
                            color="secondary"
                          >
                            {skill}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    
                    {/* Hourly Rate */}
                    <Input
                      type="number"
                      label="Hourly Rate (USD) *"
                      value={profileData.hourlyRate.toString()}
                      onChange={(e) => setProfileData({ ...profileData, hourlyRate: Number(e.target.value) })}
                      variant="bordered"
                      startContent="$"
                      endContent="/hr"
                      isRequired
                    />
                    
                    {/* Experience Level */}
                    <Select
                      label="Experience Level *"
                      selectedKeys={profileData.experienceLevel ? new Set([profileData.experienceLevel]) : new Set(['intermediate'])}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as ExperienceLevel;
                        if (selected) {
                          setProfileData({ ...profileData, experienceLevel: selected });
                        }
                      }}
                      variant="bordered"
                      isRequired
                    >
                      {experienceLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </Select>
                    
                    {/* Experience Description */}
                    <Textarea
                      label="Experience Summary"
                      placeholder="Describe your professional experience..."
                      value={profileData.experience}
                      onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                      variant="bordered"
                      minRows={3}
                      maxRows={6}
                    />
                    
                    {/* Languages */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Languages (Max 5)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Add a language..."
                          value={languageInput}
                          onChange={(e) => setLanguageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                          variant="bordered"
                          size="sm"
                        />
                        <Button
                          color="secondary"
                          size="sm"
                          onPress={handleAddLanguage}
                          isIconOnly
                        >
                          <Icon icon="lucide:plus" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profileData.languages.map((language) => (
                          <Chip
                            key={language}
                            onClose={() => handleRemoveLanguage(language)}
                            variant="flat"
                            color="primary"
                          >
                            {language}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    
                    {/* Availability */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Available for work</p>
                        <p className="text-gray-400 text-sm">
                          Let clients know you're open to new projects
                        </p>
                      </div>
                      <Switch
                        isSelected={profileData.isAvailable}
                        onValueChange={(value) => setProfileData({ ...profileData, isAvailable: value })}
                        color="success"
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </>
          )}
          
          {/* Client-specific fields */}
          {showClientFields && (
            <Card className="glass-effect border-none">
              <CardBody className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Company Information</h2>
                <div className="space-y-4">
                  <Input
                    label="Company Name"
                    value={profileData.companyName}
                    onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                    variant="bordered"
                  />
                  
                  <Select
                    label="Industry"
                    selectedKeys={profileData.industry ? new Set([profileData.industry]) : new Set([])}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setProfileData({ ...profileData, industry: selected });
                    }}
                    variant="bordered"
                  >
                    {industries.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </CardBody>
            </Card>
          )}
          
          {/* Verification Section */}
          {userData && <VerificationSection userData={userData} />}
          
          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              color="secondary"
              size="lg"
              onPress={handleSubmit}
              isLoading={loading}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="bordered"
              size="lg"
              onPress={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
      {/* Payment Account Section - Only for Freelancers */}
        {(userData?.userType === 'freelancer' || userData?.userType === 'both') && (
          <Card className="glass-effect border-none mt-6">
            <CardHeader>
              <h3 className="text-xl font-semibold">Payment Account</h3>
            </CardHeader>
            <CardBody>
              <StripeConnectOnboarding 
                onComplete={() => {
                  // Refresh user data after completing onboarding
                  toast.success('Payment account setup complete!');
                  // You might want to refetch user data here
                }} 
              />
            </CardBody>
          </Card>
        )}
      {/* Image Cropper Modal */}
      <ImageCropper
        isOpen={showCropper}
        onClose={() => {
          setShowCropper(false);
          URL.revokeObjectURL(tempImageUrl);
          setTempImageUrl('');
        }}
        imageSrc={tempImageUrl}
        onCropComplete={handleCroppedImage}
      />
    </div>
  );
};

export default EditProfilePage;