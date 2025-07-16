import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Input, Textarea, Select, SelectItem, Chip, Avatar, Switch } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { VerificationSection } from '../../components/profile/VerificationSection';

export const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [profileData, setProfileData] = useState({
    displayName: userData?.displayName || '',
    bio: userData?.bio || '',
    skills: userData?.skills || [],
    hourlyRate: userData?.hourlyRate || 0,
    portfolio: userData?.portfolio || '',
    languages: userData?.languages || ['English'],
    experienceLevel: userData?.experienceLevel || 'intermediate',
    companyName: userData?.companyName || '',
    industry: userData?.industry || '',
    isAvailable: userData?.isAvailable ?? true,
    photoURL: userData?.photoURL || ''
  });
  
  const [skillInput, setSkillInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  
  const experienceLevels = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'expert', label: 'Expert' }
  ];
  
  const industries = [
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'other', label: 'Other' }
  ];
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    setUploadingPhoto(true);
    
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `users/${user!.uid}/profile/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update profile data
      setProfileData({ ...profileData, photoURL: downloadURL });
      
      // Update in Firestore
      await updateDoc(doc(db, 'users', user!.uid), {
        photoURL: downloadURL,
        updatedAt: serverTimestamp()
      });
      
      toast.success('Profile photo updated');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };
  
  const addSkill = () => {
    if (skillInput.trim() && profileData.skills.length < 10) {
      setProfileData({ 
        ...profileData, 
        skills: [...profileData.skills, skillInput.trim()] 
      });
      setSkillInput('');
    }
  };
  
  const removeSkill = (skillToRemove: string) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter(skill => skill !== skillToRemove)
    });
  };
  
  const addLanguage = () => {
    if (languageInput.trim() && profileData.languages.length < 5) {
      setProfileData({ 
        ...profileData, 
        languages: [...profileData.languages, languageInput.trim()] 
      });
      setLanguageInput('');
    }
  };
  
  const removeLanguage = (languageToRemove: string) => {
    if (profileData.languages.length > 1) {
      setProfileData({
        ...profileData,
        languages: profileData.languages.filter(lang => lang !== languageToRemove)
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!profileData.displayName) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if ((userData?.userType === 'freelancer' || userData?.userType === 'both') && profileData.skills.length === 0) {
      toast.error('Please add at least one skill');
      return;
    }
    
    setLoading(true);
    
    try {
      const updateData: any = {
        displayName: profileData.displayName,
        bio: profileData.bio,
        updatedAt: serverTimestamp()
      };
      
      // Add freelancer-specific fields
      if (userData?.userType === 'freelancer' || userData?.userType === 'both') {
        updateData.skills = profileData.skills;
        updateData.hourlyRate = profileData.hourlyRate;
        updateData.portfolio = profileData.portfolio;
        updateData.languages = profileData.languages;
        updateData.experienceLevel = profileData.experienceLevel;
        updateData.isAvailable = profileData.isAvailable;
      }
      
      // Add client-specific fields
      if (userData?.userType === 'client' || userData?.userType === 'both') {
        updateData.companyName = profileData.companyName;
        updateData.industry = profileData.industry;
      }
      
      await updateDoc(doc(db, 'users', user!.uid), updateData);
      
      toast.success('Profile updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const userType = userData?.userType;
  const showFreelancerFields = userType === 'freelancer' || userType === 'both';
  const showClientFields = userType === 'client' || userType === 'both';
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8">Edit Profile</h1>
        
        <form onSubmit={handleSubmit}>
          {/* Profile Photo */}
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Profile Photo</h2>
              <div className="flex items-center gap-6">
                <Avatar
                  src={profileData.photoURL}
                  name={profileData.displayName}
                  size="lg"
                  className="w-24 h-24"
                />
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload">
                    <Button
                      as="span"
                      color="primary"
                      variant="flat"
                      isLoading={uploadingPhoto}
                      className="cursor-pointer"
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
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
              <div className="space-y-4">
                <Input
                  label="Display Name *"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                  variant="bordered"
                  className="text-white"
                  isRequired
                />
                
                <Textarea
                  label="Bio"
                  placeholder="Tell others about yourself..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  variant="bordered"
                  className="text-white"
                  minRows={4}
                />
                
              </div>
            </CardBody>
          </Card>
          
          {/* Freelancer-specific fields */}
          {showFreelancerFields && (
            <>
              <Card className="glass-effect border-none mb-6">
                <CardBody className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Professional Details</h2>
                  <div className="space-y-4">
                    {/* Skills */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Skills * (Max 10)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          placeholder="Add a skill"
                          variant="bordered"
                          className="text-white"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        />
                        <Button
                          type="button"
                          isIconOnly
                          color="secondary"
                          variant="flat"
                          onPress={addSkill}
                          disabled={!skillInput.trim() || profileData.skills.length >= 10}
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
                    
                    {/* Experience Level */}
                    <Select
                      label="Experience Level"
                      selectedKeys={[profileData.experienceLevel]}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        setProfileData({ ...profileData, experienceLevel: value as any });
                      }}
                      variant="bordered"
                      classNames={{
                        trigger: "bg-gray-900/50 border-gray-600 text-white",
                        value: "text-white",
                        listbox: "bg-gray-900",
                        popoverContent: "bg-gray-900",
                      }}
                    >
                      {experienceLevels.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </Select>
                    
                    {/* Hourly Rate */}
                    <Input
                      type="number"
                      label="Hourly Rate ($)"
                      value={profileData.hourlyRate.toString()}
                      onChange={(e) => setProfileData({ ...profileData, hourlyRate: parseFloat(e.target.value) || 0 })}
                      variant="bordered"
                      className="text-white"
                      startContent={<span className="text-gray-400">$</span>}
                      endContent={<span className="text-gray-400">/hour</span>}
                    />
                    
                    {/* Portfolio */}
                    <Input
                      label="Portfolio Link"
                      placeholder="https://your-portfolio.com"
                      value={profileData.portfolio}
                      onChange={(e) => setProfileData({ ...profileData, portfolio: e.target.value })}
                      variant="bordered"
                      className="text-white"
                      startContent={<Icon icon="lucide:link" className="text-gray-400" />}
                    />
                    
                    {/* Languages */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Languages (Max 5)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={languageInput}
                          onChange={(e) => setLanguageInput(e.target.value)}
                          placeholder="Add a language"
                          variant="bordered"
                          className="text-white"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                        />
                        <Button
                          type="button"
                          isIconOnly
                          color="secondary"
                          variant="flat"
                          onPress={addLanguage}
                          disabled={!languageInput.trim() || profileData.languages.length >= 5}
                        >
                          <Icon icon="lucide:plus" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profileData.languages.map((language) => (
                          <Chip
                            key={language}
                            onClose={() => removeLanguage(language)}
                            variant="flat"
                            color="secondary"
                            isCloseable={profileData.languages.length > 1}
                          >
                            {language}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    
                    {/* Availability */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white">Available for Work</p>
                        <p className="text-gray-400 text-sm">Show your availability status to clients</p>
                      </div>
                      <Switch
                        isSelected={profileData.isAvailable}
                        onValueChange={(value) => setProfileData({ ...profileData, isAvailable: value })}
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </>
          )}
          
          {/* Client-specific fields */}
          {showClientFields && (
            <Card className="glass-effect border-none mb-6">
              <CardBody className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Company Information</h2>
                <div className="space-y-4">
                  <Input
                    label="Company Name"
                    value={profileData.companyName}
                    onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                    variant="bordered"
                    className="text-white"
                    startContent={<Icon icon="lucide:building" className="text-gray-400" />}
                  />
                  
                  <Select
                    label="Industry"
                    selectedKeys={profileData.industry ? [profileData.industry] : []}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as string;
                      setProfileData({ ...profileData, industry: value });
                    }}
                    variant="bordered"
                    classNames={{
                      trigger: "bg-gray-900/50 border-gray-600 text-white",
                      value: "text-white",
                      listbox: "bg-gray-900",
                      popoverContent: "bg-gray-900",
                    }}
                  >
                    {industries.map(industry => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </CardBody>
            </Card>
          )}
          
          {/* Identity Verification */}
          <VerificationSection userData={userData} />
          
          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="bordered"
              className="flex-1"
              onPress={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              className="flex-1"
              isLoading={loading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditProfilePage;