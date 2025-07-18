import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Input, Textarea, Select, SelectItem, Chip } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

export const CreateProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData, isFreelancer } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || '',
    bio: userData?.bio || '',
    skills: userData?.skills || [],
    hourlyRate: userData?.hourlyRate || 0,
    languages: userData?.languages || ['English'],
    experienceLevel: userData?.experienceLevel || 'intermediate'
  });
  
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('');
  
  const experienceLevels = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'expert', label: 'Expert' }
  ];
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!isFreelancer) {
      toast.error('Only freelancers can create profiles');
      navigate('/dashboard');
    }
  }, [user, isFreelancer, navigate]);
  
  const handleAddSkill = () => {
    if (currentSkill.trim() && formData.skills.length < 10) {
      setFormData({ 
        ...formData, 
        skills: [...formData.skills, currentSkill.trim()] 
      });
      setCurrentSkill('');
    }
  };
  
  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };
  
  const handleAddLanguage = () => {
    if (currentLanguage.trim() && formData.languages.length < 5) {
      setFormData({ 
        ...formData, 
        languages: [...formData.languages, currentLanguage.trim()] 
      });
      setCurrentLanguage('');
    }
  };
  
  const handleRemoveLanguage = (languageToRemove: string) => {
    if (formData.languages.length > 1) { // Keep at least one language
      setFormData({
        ...formData,
        languages: formData.languages.filter(lang => lang !== languageToRemove)
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFreelancer) {
      toast.error('Only freelancers can create profiles');
      return;
    }
    
    // Validate required fields
    if (!formData.displayName || !formData.bio) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.skills.length === 0) {
      toast.error('Please add at least one skill');
      return;
    }
    
    if (formData.hourlyRate <= 0) {
      toast.error('Please set a valid hourly rate');
      return;
    }
    
    setLoading(true);
    
    try {
      await updateDoc(doc(db, 'users', user!.uid), {
        ...formData,
        profileCompleted: true,
        updatedAt: serverTimestamp(),
        isAvailable: true
      });
      
      toast.success('Profile created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8">Create Your Freelancer Profile</h1>
        
        <form onSubmit={handleSubmit}>
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <Input
                  label="Display Name"
                  placeholder="Your professional name"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  variant="bordered"
                  className="text-white"
                  startContent={<Icon icon="lucide:user" className="text-gray-400" />}
                  isRequired
                />
                
                <Textarea
                  label="Bio"
                  placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  variant="bordered"
                  className="text-white"
                  minRows={4}
                  isRequired
                />
              </div>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Skills & Experience</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Skills (Add up to 10)</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a skill"
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      variant="bordered"
                      className="text-white"
                    />
                    <Button
                      type="button"
                      color="secondary"
                      isIconOnly
                      onPress={handleAddSkill}
                      isDisabled={!currentSkill.trim() || formData.skills.length >= 10}
                    >
                      <Icon icon="lucide:plus" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map(skill => (
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
                  {formData.skills.length === 0 && (
                    <p className="text-xs text-red-400 mt-1">At least one skill is required</p>
                  )}
                </div>
                
                <Select
                  label="Experience Level"
                  placeholder="Select your experience level"
                  selectedKeys={[formData.experienceLevel]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData({ ...formData, experienceLevel: selected as 'entry' | 'intermediate' | 'expert' });
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
                    <SelectItem key={level.value} value={level.value} className="text-white">
                      {level.label}
                    </SelectItem>
                  ))}
                </Select>
                
                <Input
                  type="number"
                  label="Hourly Rate ($)"
                  placeholder="Your hourly rate"
                  value={formData.hourlyRate.toString()}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  variant="bordered"
                  className="text-white"
                  startContent={<span className="text-gray-400">$</span>}
                  endContent={<span className="text-gray-400">/hour</span>}
                  isRequired
                />
              </div>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Languages</h2>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Languages you speak (Max 5)</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a language"
                    value={currentLanguage}
                    onChange={(e) => setCurrentLanguage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
                    variant="bordered"
                    className="text-white"
                  />
                  <Button
                    type="button"
                    color="secondary"
                    isIconOnly
                    onPress={handleAddLanguage}
                    isDisabled={!currentLanguage.trim() || formData.languages.length >= 5}
                  >
                    <Icon icon="lucide:plus" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.languages.map(language => (
                    <Chip
                      key={language}
                      onClose={() => handleRemoveLanguage(language)}
                      variant="flat"
                      color="secondary"
                      isCloseable={formData.languages.length > 1}
                    >
                      {language}
                    </Chip>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
          
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
              Create Profile
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateProfilePage;