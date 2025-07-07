import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Input, Textarea, Select, SelectItem, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

export const CreateProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData, isFreelancer } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || '',
    bio: userData?.bio || '',
    location: userData?.location || '',
    skills: userData?.skills || [],
    hourlyRate: userData?.hourlyRate || 0,
    portfolio: userData?.portfolio || '',
    languages: userData?.languages || ['English'],
    experienceLevel: userData?.experienceLevel || 'intermediate'
  });
  
  const [currentSkill, setCurrentSkill] = useState('');
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!isFreelancer) {
      toast.error('Only freelancers can create profiles');
      navigate('/dashboard');
    }
  }, [user, isFreelancer, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFreelancer) {
      toast.error('Only freelancers can create profiles');
      return;
    }
    
    // Validate required fields
    if (!formData.displayName || !formData.bio || !formData.location) {
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
        updatedAt: new Date(),
        isAvailable: true
      });
      
      toast.success('Profile created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile');
    } finally {
      setLoading(false);
    }
  };
  
  const addSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };
  
  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Create Your Freelancer Profile</h1>
        <p className="text-gray-500 mb-8">
          Tell clients about your skills and experience
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardBody className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <Input
                label="Display Name"
                placeholder="John Doe"
                value={formData.displayName}
                onValueChange={(value) => setFormData(prev => ({ ...prev, displayName: value }))}
                isRequired
              />
              
              <Textarea
                label="Professional Bio"
                placeholder="Tell clients about your experience and what you can offer..."
                value={formData.bio}
                onValueChange={(value) => setFormData(prev => ({ ...prev, bio: value }))}
                minRows={4}
                isRequired
              />
              
              <Input
                label="Location"
                placeholder="City, Country"
                value={formData.location}
                onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                isRequired
              />
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Skills & Expertise</h3>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill (e.g., React, Design)"
                    value={currentSkill}
                    onValueChange={setCurrentSkill}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button
                    color="primary"
                    onPress={addSkill}
                    isIconOnly
                  >
                    <Icon icon="lucide:plus" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <Chip
                      key={skill}
                      onClose={() => removeSkill(skill)}
                      variant="flat"
                      color="primary"
                    >
                      {skill}
                    </Chip>
                  ))}
                </div>
              </div>
              
              <Input
                type="number"
                label="Hourly Rate (USD)"
                placeholder="50"
                value={formData.hourlyRate.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, hourlyRate: parseInt(value) || 0 }))}
                startContent={<span className="text-gray-500">$</span>}
                isRequired
              />
              
              <Select
                label="Experience Level"
                selectedKeys={[formData.experienceLevel]}
                onSelectionChange={(keys) => setFormData(prev => ({ 
                  ...prev, 
                  experienceLevel: Array.from(keys)[0] as string 
                }))}
              >
                <SelectItem key="entry" value="entry">Entry Level</SelectItem>
                <SelectItem key="intermediate" value="intermediate">Intermediate</SelectItem>
                <SelectItem key="expert" value="expert">Expert</SelectItem>
              </Select>
            </CardBody>
          </Card>
          
          <div className="flex gap-4">
            <Button
              color="default"
              variant="flat"
              onPress={() => navigate('/dashboard')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={loading}
              className="flex-1"
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