import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input, Textarea, Select, SelectItem, Button, Card, CardBody, Chip, RadioGroup, Radio } from "@nextui-org/react";
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
        // Navigate to the job details page - use singular 'job' not 'jobs'
        navigate(`/job/${result.jobId}`);
      } else {
        const errorMessage = result && typeof result === 'object' && 'error' in result 
          ? String(result.error) 
          : 'Failed to create job';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("Error posting job:", err);
      const errorMessage = err?.message || "Failed to post job. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      
      // If profile is incomplete, navigate to settings
      if (errorMessage.includes('complete your profile')) {
        setTimeout(() => {
          navigate('/settings');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50 py-8">
      <div className="container mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Post a New Job
            </h1>
            <p className="text-muted-foreground mt-2">
              Find the perfect freelancer for your project
            </p>
          </div>

          <Card className="border-none shadow-lg">
            <CardBody className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 text-danger">
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Job Title */}
                <Input
                  label="Job Title"
                  placeholder="e.g., Build a React Native app"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  isRequired
                  startContent={<Icon icon="solar:document-text-bold" className="text-default-400" />}
                />

                {/* Description */}
                <Textarea
                  label="Job Description"
                  placeholder="Describe your project in detail..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  minRows={6}
                  isRequired
                />

                {/* Category and Subcategory */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Category"
                    placeholder="Select a category"
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    isRequired
                    aria-label="Category"
                  >
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    label="Subcategory (Optional)"
                    placeholder="e.g., Mobile App Development"
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange("subcategory", e.target.value)}
                  />
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Required Skills
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill and press Enter"
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      endContent={
                        <Button
                          size="sm"
                          isIconOnly
                          onPress={addSkill}
                          isDisabled={!currentSkill.trim()}
                        >
                          <Icon icon="solar:add-circle-bold" />
                        </Button>
                      }
                    />
                  </div>
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
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
                  )}
                </div>

                {/* Budget Type */}
                <RadioGroup
                  label="Budget Type"
                  value={formData.budgetType}
                  onValueChange={(value) => handleInputChange("budgetType", value)}
                  orientation="horizontal"
                >
                  <Radio value="fixed">Fixed Price</Radio>
                  <Radio value="hourly">Hourly Rate</Radio>
                </RadioGroup>

                {/* Budget Inputs */}
                {formData.budgetType === "fixed" ? (
                  <Input
                    type="number"
                    label="Fixed Price"
                    placeholder="Enter amount"
                    value={formData.fixedPrice.toString()}
                    onChange={(e) => handleInputChange("fixedPrice", Number(e.target.value))}
                    startContent="$"
                    isRequired
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      label="Minimum Hourly Rate"
                      placeholder="Min"
                      value={formData.budgetMin.toString()}
                      onChange={(e) => handleInputChange("budgetMin", Number(e.target.value))}
                      startContent="$"
                      endContent="/hr"
                      isRequired
                    />
                    <Input
                      type="number"
                      label="Maximum Hourly Rate"
                      placeholder="Max"
                      value={formData.budgetMax.toString()}
                      onChange={(e) => handleInputChange("budgetMax", Number(e.target.value))}
                      startContent="$"
                      endContent="/hr"
                      isRequired
                    />
                  </div>
                )}

                {/* Experience Level */}
                <Select
                  label="Experience Level"
                  placeholder="Select experience level"
                  value={formData.experienceLevel}
                  onChange={(e) => handleInputChange("experienceLevel", e.target.value)}
                  isRequired
                  aria-label="Experience Level"
                >
                  {experienceLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </Select>

                {/* Duration and Project Size */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Project Duration"
                    placeholder="Select duration"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                    isRequired
                    aria-label="Project Duration"
                  >
                    {durations.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Project Size"
                    placeholder="Select size"
                    value={formData.projectSize}
                    onChange={(e) => handleInputChange("projectSize", e.target.value)}
                    aria-label="Project Size"
                  >
                    {projectSizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Location Type */}
                <RadioGroup
                  label="Location Type"
                  value={formData.locationType}
                  onValueChange={(value) => handleInputChange("locationType", value)}
                  orientation="horizontal"
                >
                  <Radio value="remote">Remote</Radio>
                  <Radio value="onsite">On-site</Radio>
                  <Radio value="hybrid">Hybrid</Radio>
                </RadioGroup>

                {formData.locationType !== "remote" && (
                  <Input
                    label="Location"
                    placeholder="City, Country"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    isRequired
                    startContent={<Icon icon="solar:map-point-bold" className="text-default-400" />}
                  />
                )}

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    color="primary"
                    size="lg"
                    isLoading={loading}
                    className="flex-1"
                  >
                    Post Job
                  </Button>
                  <Button
                    variant="flat"
                    size="lg"
                    onPress={() => navigate(-1)}
                    isDisabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};