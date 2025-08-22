import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardBody, 
  CardHeader,
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
import { useTranslation } from 'react-i18next';

export const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { t } = useTranslation();
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
    category: userData?.category || '',
    companyName: userData?.companyName || '',
    industry: userData?.industry || '',
    isAvailable: userData?.isAvailable ?? true,
    photoURL: userData?.photoURL || ''
  });
  
  const [skillInput, setSkillInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  
  const experienceLevels = [
    { value: 'entry', label: t('editProfile.experienceLevels.entry') },
    { value: 'intermediate', label: t('editProfile.experienceLevels.intermediate') },
    { value: 'expert', label: t('editProfile.experienceLevels.expert') }
  ];
  
  const industries = [
    { value: 'technology', label: t('editProfile.industries.technology') },
    { value: 'finance', label: t('editProfile.industries.finance') },
    { value: 'healthcare', label: t('editProfile.industries.healthcare') },
    { value: 'education', label: t('editProfile.industries.education') },
    { value: 'retail', label: t('editProfile.industries.retail') },
    { value: 'manufacturing', label: t('editProfile.industries.manufacturing') },
    { value: 'marketing', label: t('editProfile.industries.marketing') },
    { value: 'design', label: t('editProfile.industries.design') },
    { value: 'consulting', label: t('editProfile.industries.consulting') },
    { value: 'other', label: t('editProfile.industries.other') }
  ];
  
  const freelancerCategories = [
  { value: 'design', label: t('editProfile.categories.design') },
  { value: 'development', label: t('editProfile.categories.development') },
  { value: 'writing', label: t('editProfile.categories.writing') },
  { value: 'marketing', label: t('editProfile.categories.marketing') },
  { value: 'video', label: t('editProfile.categories.video') },
  { value: 'music', label: t('editProfile.categories.music') },
  { value: 'business', label: t('editProfile.categories.business') },
  { value: 'data', label: t('editProfile.categories.data') },
  { value: 'photography', label: t('editProfile.categories.photography') },
  { value: 'translation', label: t('editProfile.categories.translation') }
];
  const showFreelancerFields = userData?.userType === 'freelancer' || userData?.userType === 'both';
  const showClientFields = userData?.userType === 'client' || userData?.userType === 'both';
  
  const selectedCategoryKeys = useMemo(
    () => {
      if (profileData.category && profileData.category !== '') {
        return new Set([profileData.category]);
      }
      return new Set<string>();
    },
    [profileData.category]
  );

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
      toast.error(t('editProfile.errors.imageTooLarge'));
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('editProfile.errors.invalidImageType'));
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
      
      toast.success(t('editProfile.success.photoUploaded'));
      
      // Clean up
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl('');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      
      if (error.code === 'storage/unauthorized') {
        toast.error(t('editProfile.errors.permissionDenied'));
      } else if (error.code === 'storage/canceled') {
        toast.error(t('editProfile.errors.uploadCancelled'));
      } else {
        toast.error(t('editProfile.errors.uploadFailed'));
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
      toast.error(t('editProfile.errors.maxSkills'));
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
      toast.error(t('editProfile.errors.maxLanguages'));
    }
  };
  
  const handleRemoveLanguage = (languageToRemove: string) => {
    if (profileData.languages.length > 1) {
      setProfileData({
        ...profileData,
        languages: profileData.languages.filter(lang => lang !== languageToRemove)
      });
    } else {
      toast.error(t('editProfile.errors.minLanguages'));
    }
  };
  
  const validateProfile = () => {
    if (!profileData.displayName.trim()) {
      toast.error(t('editProfile.errors.displayNameRequired'));
      return false;
    }
    
    if (!profileData.bio.trim()) {
      toast.error(t('editProfile.errors.bioRequired'));
      return false;
    }
    if (!profileData.category) {
      toast.error(t('editProfile.errors.categoryRequired'));
      return false;
    }

    if ((userData?.userType === 'freelancer' || userData?.userType === 'both') && profileData.skills.length === 0) {
      toast.error(t('editProfile.errors.skillsRequired'));
      return false;
    }
    
    if ((userData?.userType === 'freelancer' || userData?.userType === 'both') && profileData.hourlyRate <= 0) {
      toast.error(t('editProfile.errors.hourlyRateRequired'));
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
        updateData.category = profileData.category; // ADD THIS LINE
      }
      
      // Add client-specific fields
      if (showClientFields) {
        updateData.companyName = profileData.companyName.trim();
        updateData.industry = profileData.industry;
      }
      
      await updateDoc(doc(db, 'users', user.uid), updateData);
      
      toast.success(t('editProfile.success.profileUpdated'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('editProfile.errors.updateFailed'));
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
          <h1 className="text-3xl font-bold text-white mb-2">{t('editProfile.title')}</h1>
          <p className="text-gray-400">{t('editProfile.subtitle')}</p>
        </div>
        
        <div className="space-y-6">
          {/* Profile Photo */}
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{t('editProfile.profilePhoto')}</h2>
              <div className="flex items-center gap-6">
                <Avatar
                  src={profileData.photoURL || `https://ui-avatars.com/api/?name=${profileData.displayName}&background=FCE90D&color=011241`}
                  className="w-24 h-24"
                />
                <div>
                <Button
                  color="secondary"
                  variant="flat"
                  isLoading={uploadingPhoto}
                  disabled={uploadingPhoto}
                  startContent={!uploadingPhoto && <Icon icon="lucide:camera" />}
                  onPress={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
                    input.onchange = (e: any) => handlePhotoSelect(e);
                    input.click();
                  }}
                >
                  {uploadingPhoto ? t('editProfile.uploading') : t('editProfile.changePhoto')}
                </Button>
                  <p className="text-gray-400 text-sm mt-2">
                    {t('editProfile.photoHelp')}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Basic Information */}
          <Card className="form-section">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{t('editProfile.basicInfo')}</h2>
              <div className="space-y-4">
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('editProfile.displayName')} *
                  </label>
                  <Input
                    // Remove the label prop
                    placeholder={t('editProfile.displayNamePlaceholder')}
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    isRequired
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                    }}
                  />
                </div>
                
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('editProfile.bio')} *
                  </label>
                  <Textarea
                    // Remove the label prop
                    placeholder={t('editProfile.bioPlaceholder')}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    minRows={4}
                    maxRows={8}
                    isRequired
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                    }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Freelancer-specific fields */}
          {showFreelancerFields && (
            <>
              <Card className="form-section">
                <CardBody className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">{t('editProfile.professionalDetails')}</h2>
                  <div className="space-y-4">

                    {/* Category - ADD THIS SECTION FIRST */}
                    {/* Category */}
                    <div className="form-field">
                    <label className="text-white text-sm font-medium mb-2 block">
                      {t('editProfile.primaryCategory')} *
                    </label>

                    <Select
                      placeholder={t('editProfile.categoryPlaceholder')}
                      selectionMode="single"
                      selectedKeys={selectedCategoryKeys}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        console.log('Category selected:', selectedKey); // Debug log
                        setProfileData(prev => ({ 
                          ...prev, 
                          category: selectedKey || '' 
                        }));
                      }}
                      isRequired
                      classNames={{
                        trigger: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10",
                        value: "text-white",
                      }}
                    >
                      {freelancerCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                    {/* Skills */}
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">
                        {t('editProfile.skills')}
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder={t('editProfile.skillsPlaceholder')}
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                          size="sm"
                          classNames={{
                            input: "text-white",
                            inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                          }}
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
                    <div className="form-field">
                      <label className="text-white text-sm font-medium mb-2 block">
                        {t('editProfile.hourlyRate')} *
                      </label>
                      <Input
                        // Remove the label prop
                        type="number"
                        placeholder={t('editProfile.hourlyRatePlaceholder')}
                        value={profileData.hourlyRate.toString()}
                        onChange={(e) => setProfileData({ ...profileData, hourlyRate: Number(e.target.value) })}
                        startContent="€"
                        endContent={t('editProfile.perHour')}
                        isRequired
                        classNames={{
                          input: "text-white",
                          inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                        }}
                      />
                    </div>
                    {/* Experience Level */}
                    <div className="form-field">
                      <label className="text-white text-sm font-medium mb-2 block">
                        {t('editProfile.experienceLevel')} *
                      </label>
                      <Select
                        // Remove the label prop
                        selectedKeys={profileData.experienceLevel ? new Set([profileData.experienceLevel]) : new Set(['intermediate'])}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as ExperienceLevel;
                          if (selected) {
                            setProfileData({ ...profileData, experienceLevel: selected });
                          }
                        }}
                        isRequired
                        classNames={{
                          trigger: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10",
                          value: "text-white"
                        }}
                      >
                        {experienceLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>   
                    {/* Experience Description */}
                    <div className="form-field">
                      <label className="text-white text-sm font-medium mb-2 block">
                        {t('editProfile.experienceSummary')}
                      </label>
                      <Textarea
                        // Remove the label prop
                        placeholder={t('editProfile.experiencePlaceholder')}
                        value={profileData.experience}
                        onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                        minRows={3}
                        maxRows={6}
                        classNames={{
                          input: "text-white",
                          inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                        }}
                      />
                    </div>
                    
                    {/* Languages */}
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">
                        {t('editProfile.languages')}
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder={t('editProfile.languagesPlaceholder')}
                          value={languageInput}
                          onChange={(e) => setLanguageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                          size="sm"
                          classNames={{
                            input: "text-white",
                            inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                          }}
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
                        <p className="text-white font-medium">{t('editProfile.availableForWork')}</p>
                        <p className="text-gray-400 text-sm">
                          {t('editProfile.availableDescription')}
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
            <Card className="form-section">
              <CardBody className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">{t('editProfile.companyInfo')}</h2>
                <div className="space-y-4">
                  <div className="form-field">
                    <label className="text-white text-sm font-medium mb-2 block">
                      {t('editProfile.companyName')}
                    </label>
                    <Input
                      placeholder={t('editProfile.companyNamePlaceholder')}
                      value={profileData.companyName}
                      onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                      }}
                    />
                  </div>
                  
                  <div className="form-field">
                    <label className="text-white text-sm font-medium mb-2 block">
                      {t('editProfile.industry')}
                    </label>
                    <Select
                      placeholder={t('editProfile.industryPlaceholder')}
                      selectedKeys={profileData.industry ? new Set([profileData.industry]) : new Set([])}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setProfileData({ ...profileData, industry: selected });
                      }}
                      classNames={{
                        trigger: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10",
                        value: "text-white"
                      }}
                    >
                      {industries.map((industry) => (
                        <SelectItem key={industry.value} value={industry.value}>
                          {industry.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
          
          {/* Payment Account Section - Only for Freelancers */}
          {(userData?.userType === 'freelancer' || userData?.userType === 'both') && (
            <Card className="form-section">
              <CardHeader>
                <h3 className="text-xl font-semibold">{t('editProfile.paymentAccount')}</h3>
              </CardHeader>
              <CardBody>
                <StripeConnectOnboarding 
                  onComplete={() => {
                    // Refresh user data after completing onboarding
                    toast.success(t('editProfile.success.paymentSetup'));
                    // You might want to refetch user data here
                  }} 
                />
              </CardBody>
            </Card>
          )}
          
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
              {loading ? t('editProfile.saving') : t('editProfile.saveChanges')}
            </Button>
            <Button
              variant="bordered"
              size="lg"
              onPress={() => navigate(-1)}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </motion.div>
      
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