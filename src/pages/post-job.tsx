import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input, Textarea, Select, SelectItem, Button, Card, CardBody, Chip, RadioGroup, Radio } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

export const PostJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData, canPostJobs, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Check permissions on mount
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error("Please login to post jobs");
        navigate('/login');
      } else if (!canPostJobs) {
        toast.error("Only clients can post jobs. Your account type is: " + userData?.userType);
        navigate('/dashboard');
      }
    }
  }, [user, userData, canPostJobs, authLoading, navigate]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    skills: [] as string[],
    budgetType: "fixed",
    fixedPrice: 0,
    budgetMin: 0,
    budgetMax: 0,
    duration: "",
    experienceLevel: "",
    projectSize: "medium"
  });
  
  const [currentSkill, setCurrentSkill] = useState("");
  
  const categories = [
    { value: "development", label: "Development" },
    { value: "design", label: "Design" },
    { value: "marketing", label: "Marketing" },
    { value: "writing", label: "Writing" },
    { value: "video", label: "Video & Animation" },
    { value: "data-science", label: "Data Science" },
    { value: "business", label: "Business" }
  ];
  
  const experienceLevels = [
    { value: "entry", label: "Entry Level" },
    { value: "intermediate", label: "Intermediate" },
    { value: "expert", label: "Expert" }
  ];

  const durations = [
    { value: "less-than-week", label: "Less than a week" },
    { value: "1-2-weeks", label: "1-2 weeks" },
    { value: "1-month", label: "1 month" },
    { value: "1-3-months", label: "1-3 months" },
    { value: "3-6-months", label: "3-6 months" },
    { value: "more-than-6-months", label: "More than 6 months" }
  ];

  const handleAddSkill = () => {
    if (currentSkill.trim() && formData.skills.length < 10) {
      setFormData({ ...formData, skills: [...formData.skills, currentSkill.trim()] });
      setCurrentSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.description || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (formData.skills.length === 0) {
      toast.error("Please add at least one skill");
      return;
    }
    
    if (formData.budgetType === 'fixed' && formData.fixedPrice <= 0) {
      toast.error("Please enter a valid fixed price");
      return;
    }
    
    if (formData.budgetType === 'hourly' && (formData.budgetMin <= 0 || formData.budgetMax <= 0)) {
      toast.error("Please enter valid hourly rate range");
      return;
    }
    
    if (!formData.experienceLevel) {
      toast.error("Please select experience level");
      return;
    }
    
    setLoading(true);
    
    try {
      const jobId = doc(collection(db, 'jobs')).id;
      
      const jobData = {
        id: jobId,
        clientId: user!.uid,
        clientName: userData?.displayName || 'Anonymous',
        clientPhotoURL: userData?.photoURL || '',
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        skills: formData.skills,
        budgetType: formData.budgetType,
        budgetMin: formData.budgetType === 'hourly' ? formData.budgetMin : formData.fixedPrice,
        budgetMax: formData.budgetType === 'hourly' ? formData.budgetMax : formData.fixedPrice,
        duration: formData.duration,
        experienceLevel: formData.experienceLevel || 'intermediate',
        projectSize: formData.projectSize,
        status: 'open',
        proposalCount: 0,
        invitesSent: 0,
        featured: false,
        urgent: false,
        verified: userData?.isVerified || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        viewCount: 0
      };
      
      await setDoc(doc(db, 'jobs', jobId), jobData);
      
      toast.success('Job posted successfully!');
      navigate('/jobs/manage');
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8">Post a New Job</h1>
        
        <form onSubmit={handleSubmit}>
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Job Details</h2>
              
              <div className="space-y-4">
                <Input
                  label="Job Title"
                  placeholder="e.g. Full Stack Developer needed for E-commerce Site"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  variant="bordered"
                  className="text-white"
                  isRequired
                />
                
                <Textarea
                  label="Job Description"
                  placeholder="Describe the job requirements, responsibilities, and any specific skills needed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  variant="bordered"
                  className="text-white"
                  minRows={6}
                  isRequired
                />
                
                <Select
                  label="Category"
                  placeholder="Select a category"
                  selectedKeys={formData.category ? [formData.category] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData({ ...formData, category: selected });
                  }}
                  variant="bordered"
                  classNames={{
                    trigger: "bg-gray-900/50 border-gray-600 text-white",
                    value: "text-white",
                    listbox: "bg-gray-900",
                    popoverContent: "bg-gray-900",
                  }}
                  isRequired
                >
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value} className="text-white">
                      {cat.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Skills & Experience</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Required Skills</label>
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
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Experience Level *</label>
                  <RadioGroup
                    value={formData.experienceLevel}
                    onValueChange={(value) => {
                      console.log('Experience level selected:', value);
                      setFormData({ ...formData, experienceLevel: value });
                    }}
                    orientation="horizontal"
                    className="text-white"
                  >
                    {experienceLevels.map(level => (
                      <Radio key={level.value} value={level.value} className="text-white">
                        {level.label}
                      </Radio>
                    ))}
                  </RadioGroup>
                </div>
                
                <Select
                  label="Project Duration"
                  placeholder="Select duration"
                  selectedKeys={formData.duration ? [formData.duration] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData({ ...formData, duration: selected });
                  }}
                  variant="bordered"
                  classNames={{
                    trigger: "bg-gray-900/50 border-gray-600 text-white",
                    value: "text-white",
                    listbox: "bg-gray-900",
                    popoverContent: "bg-gray-900",
                  }}
                  isRequired
                >
                  {durations.map(duration => (
                    <SelectItem key={duration.value} value={duration.value} className="text-white">
                      {duration.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Budget</h2>
              
              <div className="space-y-4">
                <RadioGroup
                  label="Budget Type"
                  value={formData.budgetType}
                  onValueChange={(value) => setFormData({ ...formData, budgetType: value })}
                  orientation="horizontal"
                  className="text-white"
                >
                  <Radio value="fixed" className="text-white">Fixed Price</Radio>
                  <Radio value="hourly" className="text-white">Hourly Rate</Radio>
                </RadioGroup>
                
                {formData.budgetType === 'fixed' ? (
                  <Input
                    type="number"
                    label="Fixed Price ($)"
                    placeholder="Enter amount"
                    value={formData.fixedPrice.toString()}
                    onChange={(e) => setFormData({ ...formData, fixedPrice: parseFloat(e.target.value) || 0 })}
                    variant="bordered"
                    className="text-white"
                    startContent={<span className="text-gray-400">$</span>}
                    isRequired
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      label="Min Hourly Rate ($)"
                      placeholder="Min"
                      value={formData.budgetMin.toString()}
                      onChange={(e) => setFormData({ ...formData, budgetMin: parseFloat(e.target.value) || 0 })}
                      variant="bordered"
                      className="text-white"
                      startContent={<span className="text-gray-400">$</span>}
                      isRequired
                    />
                    <Input
                      type="number"
                      label="Max Hourly Rate ($)"
                      placeholder="Max"
                      value={formData.budgetMax.toString()}
                      onChange={(e) => setFormData({ ...formData, budgetMax: parseFloat(e.target.value) || 0 })}
                      variant="bordered"
                      className="text-white"
                      startContent={<span className="text-gray-400">$</span>}
                      isRequired
                    />
                  </div>
                )}
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
              Post Job
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PostJobPage;