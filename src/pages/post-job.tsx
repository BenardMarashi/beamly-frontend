import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input, Textarea, Select, SelectItem, Button, Card, CardBody, Chip, RadioGroup, Radio } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { JobService } from '../services/firebase-services';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

// Type definition for JobService result
interface JobServiceResult {
  success: boolean;
  jobId?: string;
  error?: any;
}

export const PostJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData, canPostJobs, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    experienceLevel: "intermediate",
    locationType: "remote",
    location: "",
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

  const projectSizes = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" }
  ];
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error when user makes changes
  };
  
  const addSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      handleInputChange("skills", [...formData.skills, currentSkill.trim()]);
      setCurrentSkill("");
    }
  };
  
  const removeSkill = (skill: string) => {
    handleInputChange("skills", formData.skills.filter(s => s !== skill));
  };
  
  const validateForm = () => {
    if (!formData.title.trim()) return "Job title is required";
    if (!formData.description.trim()) return "Job description is required";
    if (!formData.category) return "Please select a category";
    if (formData.skills.length === 0) return "Please add at least one skill";
    if (!formData.experienceLevel) return "Please select experience level";
    if (!formData.duration) return "Please specify project duration";
    
    if (formData.budgetType === "fixed") {
      if (!formData.fixedPrice || formData.fixedPrice <= 0) {
        return "Please enter a valid fixed price";
      }
    } else {
      if (!formData.budgetMin || !formData.budgetMax) {
        return "Please enter both minimum and maximum hourly rates";
      }
      if (formData.budgetMin >= formData.budgetMax) {
        return "Maximum rate must be higher than minimum rate";
      }
    }
    
    if (formData.locationType !== "remote" && !formData.location.trim()) {
      return "Please specify location for non-remote jobs";
    }
    
    return null;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canPostJobs) {
      toast.error("Only clients can post jobs");
      return;
    }
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }
    
    if (!user) {
      setError("You must be logged in to post a job");
      toast.error("Please log in to post a job");
      navigate('/login');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get user profile to verify permissions and profile completion
      console.log("Checking user profile for job posting...");
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        console.error("User document not found in Firestore");
        throw new Error('User profile not found. Please complete your profile setup first.');
      }
      
      const userData = userDoc.data();
      console.log("User data from Firestore:", {
        userType: userData.userType,
        profileCompleted: userData.profileCompleted,
        hasDisplayName: !!userData.displayName,
        hasBio: !!userData.bio,
        hasLocation: !!userData.location
      });
      
      // Check user type
      if (!userData.userType) {
        throw new Error('Account type not set. Please complete your profile setup.');
      }
      
      if (userData.userType !== 'client' && userData.userType !== 'both') {
        throw new Error('Only clients can post jobs. Your account type is: ' + userData.userType);
      }
      
      // Check if profile is completed
      const requiredFields = [];
      if (!userData.displayName?.trim()) requiredFields.push('Display Name');
      if (!userData.bio?.trim()) requiredFields.push('Bio');
      if (!userData.location?.trim()) requiredFields.push('Location');
      
      if (requiredFields.length > 0) {
        console.log("Missing required fields:", requiredFields);
        throw new Error(`Please complete your profile before posting jobs. Missing: ${requiredFields.join(', ')}`);
      }

      // Prepare the job data with proper typing
      const jobData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory || "",
        skills: formData.skills,
        budgetType: formData.budgetType as 'fixed' | 'hourly',
        budgetMin: formData.budgetType === "hourly" ? formData.budgetMin : formData.fixedPrice,
        budgetMax: formData.budgetType === "hourly" ? formData.budgetMax : formData.fixedPrice,
        fixedPrice: formData.budgetType === "fixed" ? formData.fixedPrice : 0,
        hourlyRateMin: formData.budgetType === "hourly" ? formData.budgetMin : 0,
        hourlyRateMax: formData.budgetType === "hourly" ? formData.budgetMax : 0,
        duration: formData.duration,
        experienceLevel: formData.experienceLevel,
        locationType: formData.locationType,
        location: formData.location,
        projectSize: formData.projectSize,
        clientId: user.uid,
        clientName: userData.displayName || user.displayName || 'Anonymous',
        clientPhotoURL: userData.photoURL || user.photoURL || '',
      };
      
      console.log('Submitting job data:', jobData);
      
      // Use the JobService to create the job
      const result: JobServiceResult = await JobService.createJob(jobData);
      
      if (result.success && result.jobId) {
        toast.success('Job posted successfully!');
        // Navigate to the job details page
        navigate(`/jobs/${result.jobId}`);
      } else {
        const errorMessage = result && typeof result === 'object' && 'error' in result 
          ? (typeof result.error === 'string' ? result.error : 'Failed to post job')
          : 'Failed to post job';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error posting job:', error);
      const errorMessage = error.message || 'Failed to post job. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-8">Post a New Job</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <h3 className="text-xl font-semibold">Job Details</h3>
              
              <Input
                label="Job Title"
                placeholder="e.g., React Developer Needed for E-commerce Website"
                value={formData.title}
                onValueChange={(value) => handleInputChange("title", value)}
                isRequired
              />
              
              <Textarea
                label="Job Description"
                placeholder="Describe the job, requirements, and what you're looking for..."
                value={formData.description}
                onValueChange={(value) => handleInputChange("description", value)}
                minRows={5}
                isRequired
              />
              
              <Select
                label="Category"
                placeholder="Select a category"
                selectedKeys={formData.category ? [formData.category] : []}
                onSelectionChange={(keys) => handleInputChange("category", Array.from(keys)[0])}
                isRequired
              >
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </Select>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Required Skills</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill"
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
                    >
                      {skill}
                    </Chip>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="space-y-4">
              <h3 className="text-xl font-semibold">Budget & Timeline</h3>
              
              <RadioGroup
                label="Budget Type"
                value={formData.budgetType}
                onValueChange={(value) => handleInputChange("budgetType", value)}
              >
                <Radio value="fixed">Fixed Price</Radio>
                <Radio value="hourly">Hourly Rate</Radio>
              </RadioGroup>
              
              {formData.budgetType === "fixed" ? (
                <Input
                  type="number"
                  label="Fixed Price (USD)"
                  placeholder="1000"
                  value={formData.fixedPrice.toString()}
                  onValueChange={(value) => handleInputChange("fixedPrice", parseInt(value) || 0)}
                  startContent={<span className="text-default-400">$</span>}
                  isRequired
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Minimum Rate (USD/hr)"
                    placeholder="25"
                    value={formData.budgetMin.toString()}
                    onValueChange={(value) => handleInputChange("budgetMin", parseInt(value) || 0)}
                    startContent={<span className="text-default-400">$</span>}
                    isRequired
                  />
                  <Input
                    type="number"
                    label="Maximum Rate (USD/hr)"
                    placeholder="50"
                    value={formData.budgetMax.toString()}
                    onValueChange={(value) => handleInputChange("budgetMax", parseInt(value) || 0)}
                    startContent={<span className="text-default-400">$</span>}
                    isRequired
                  />
                </div>
              )}
              
              <Select
                label="Project Duration"
                placeholder="Select duration"
                selectedKeys={formData.duration ? [formData.duration] : []}
                onSelectionChange={(keys) => handleInputChange("duration", Array.from(keys)[0])}
                isRequired
              >
                {durations.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value}>
                    {duration.label}
                  </SelectItem>
                ))}
              </Select>
              
              <Select
                label="Project Size"
                placeholder="Select project size"
                selectedKeys={[formData.projectSize]}
                onSelectionChange={(keys) => handleInputChange("projectSize", Array.from(keys)[0])}
              >
                {projectSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </Select>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="space-y-4">
              <h3 className="text-xl font-semibold">Requirements</h3>
              
              <Select
                label="Experience Level"
                placeholder="Select experience level"
                selectedKeys={[formData.experienceLevel]}
                onSelectionChange={(keys) => handleInputChange("experienceLevel", Array.from(keys)[0])}
              >
                {experienceLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </Select>
              
              <RadioGroup
                label="Location Type"
                value={formData.locationType}
                onValueChange={(value) => handleInputChange("locationType", value)}
              >
                <Radio value="remote">Remote</Radio>
                <Radio value="onsite">On-site</Radio>
                <Radio value="hybrid">Hybrid</Radio>
              </RadioGroup>
              
              {formData.locationType !== "remote" && (
                <Input
                  label="Location"
                  placeholder="e.g., New York, NY"
                  value={formData.location}
                  onValueChange={(value) => handleInputChange("location", value)}
                  isRequired
                />
              )}
            </CardBody>
          </Card>
          
          {error && (
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}
          
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
              Post Job
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PostJobPage;