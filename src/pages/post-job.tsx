import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input, Textarea, Select, SelectItem, Button, Card, CardBody, Chip, RadioGroup, Radio } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { httpsCallable } from 'firebase/functions';
import { fns } from '../lib/firebase';
import { toast } from 'react-hot-toast';

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
      // Prepare the data for the Cloud Function
      const jobData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory || "",
        skills: formData.skills,
        budgetType: formData.budgetType,
        budgetMin: formData.budgetType === "hourly" ? formData.budgetMin : formData.fixedPrice,
        budgetMax: formData.budgetType === "hourly" ? formData.budgetMax : formData.fixedPrice,
        fixedPrice: formData.budgetType === "fixed" ? formData.fixedPrice : 0,
        hourlyRateMin: formData.budgetType === "hourly" ? formData.budgetMin : 0,
        hourlyRateMax: formData.budgetType === "hourly" ? formData.budgetMax : 0,
        duration: formData.duration,
        experienceLevel: formData.experienceLevel,
        locationType: formData.locationType,
        location: formData.location,
        projectSize: formData.projectSize
      };
      
      console.log('Submitting job data:', jobData);
      
      // Call the Cloud Function
      const createJob = httpsCallable(fns, 'createJob');
      const result = await createJob(jobData);
      
      if ((result.data as any).success) {
        toast.success('Job posted successfully!');
        navigate(`/jobs/${(result.data as any).jobId}`);
      } else {
        throw new Error('Failed to create job');
      }
    } catch (err: any) {
      console.error("Error posting job:", err);
      
      // Handle specific error cases
      if (err.code === 'permission-denied') {
        setError("Your account type doesn't allow posting jobs. Please update your profile.");
        toast.error("Permission denied. Please ensure your account type is set to 'Client' or 'Both'.");
      } else if (err.code === 'unauthenticated') {
        setError("You must be logged in to post a job");
        toast.error("Please log in to post a job");
        navigate('/login');
      } else {
        setError(err.message || "An error occurred while posting the job. Please try again.");
        toast.error(err.message || "Failed to post job. Please try again.");
      }
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Post a New Job
          </h1>
          <p className="mt-2 text-gray-300">
            Find the perfect freelancer for your project
          </p>
        </div>
        
        <Card className="glass-card border-none">
          <CardBody className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  Job Title *
                </label>
                <Input
                  placeholder="e.g., Build a WordPress website"
                  value={formData.title}
                  onValueChange={(value) => handleInputChange("title", value)}
                  variant="bordered"
                  className="bg-white/10"
                  isRequired
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  Job Description *
                </label>
                <Textarea
                  placeholder="Describe your project in detail..."
                  value={formData.description}
                  onValueChange={(value) => handleInputChange("description", value)}
                  variant="bordered"
                  minRows={6}
                  className="bg-white/10"
                  isRequired
                />
              </div>
              
              {/* Category and Experience Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">
                    Category *
                  </label>
                  <Select
                    placeholder="Select category"
                    selectedKeys={formData.category ? [formData.category] : []}
                    onSelectionChange={(keys) => handleInputChange("category", Array.from(keys)[0])}
                    variant="bordered"
                    className="bg-white/10"
                    isRequired
                  >
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">
                    Experience Level *
                  </label>
                  <Select
                    placeholder="Select experience level"
                    selectedKeys={formData.experienceLevel ? [formData.experienceLevel] : []}
                    onSelectionChange={(keys) => handleInputChange("experienceLevel", Array.from(keys)[0])}
                    variant="bordered"
                    className="bg-white/10"
                    isRequired
                  >
                    {experienceLevels.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
              
              {/* Skills */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  Required Skills *
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a skill..."
                    value={currentSkill}
                    onValueChange={setCurrentSkill}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    variant="bordered"
                    className="bg-white/10"
                  />
                  <Button
                    type="button"
                    color="secondary"
                    onPress={addSkill}
                    isDisabled={!currentSkill.trim()}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <Chip
                      key={index}
                      onClose={() => removeSkill(skill)}
                      color="secondary"
                      variant="flat"
                    >
                      {skill}
                    </Chip>
                  ))}
                </div>
              </div>
              
              {/* Budget Type */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  Budget Type *
                </label>
                <RadioGroup
                  value={formData.budgetType}
                  onValueChange={(value) => handleInputChange("budgetType", value)}
                  orientation="horizontal"
                >
                  <Radio value="fixed">Fixed Price</Radio>
                  <Radio value="hourly">Hourly Rate</Radio>
                </RadioGroup>
              </div>
              
              {/* Budget Fields */}
              {formData.budgetType === "fixed" ? (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">
                    Fixed Price (USD) *
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter fixed price"
                    value={formData.fixedPrice.toString()}
                    onValueChange={(value) => handleInputChange("fixedPrice", parseFloat(value) || 0)}
                    variant="bordered"
                    className="bg-white/10"
                    startContent={<span className="text-gray-400">$</span>}
                    isRequired
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-200">
                      Min Hourly Rate (USD) *
                    </label>
                    <Input
                      type="number"
                      placeholder="Min rate"
                      value={formData.budgetMin.toString()}
                      onValueChange={(value) => handleInputChange("budgetMin", parseFloat(value) || 0)}
                      variant="bordered"
                      className="bg-white/10"
                      startContent={<span className="text-gray-400">$</span>}
                      isRequired
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-200">
                      Max Hourly Rate (USD) *
                    </label>
                    <Input
                      type="number"
                      placeholder="Max rate"
                      value={formData.budgetMax.toString()}
                      onValueChange={(value) => handleInputChange("budgetMax", parseFloat(value) || 0)}
                      variant="bordered"
                      className="bg-white/10"
                      startContent={<span className="text-gray-400">$</span>}
                      isRequired
                    />
                  </div>
                </div>
              )}
              
              {/* Duration and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">
                    Project Duration *
                  </label>
                  <Input
                    placeholder="e.g., 2 weeks, 3 months"
                    value={formData.duration}
                    onValueChange={(value) => handleInputChange("duration", value)}
                    variant="bordered"
                    className="bg-white/10"
                    isRequired
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">
                    Location Type
                  </label>
                  <RadioGroup
                    value={formData.locationType}
                    onValueChange={(value) => handleInputChange("locationType", value)}
                    orientation="horizontal"
                  >
                    <Radio value="remote">Remote</Radio>
                    <Radio value="onsite">On-site</Radio>
                    <Radio value="hybrid">Hybrid</Radio>
                  </RadioGroup>
                </div>
              </div>
              
              {/* Location (if not remote) */}
              {formData.locationType !== "remote" && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">
                    Location *
                  </label>
                  <Input
                    placeholder="e.g., New York, NY"
                    value={formData.location}
                    onValueChange={(value) => handleInputChange("location", value)}
                    variant="bordered"
                    className="bg-white/10"
                    isRequired
                  />
                </div>
              )}
              
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-500 text-sm flex items-center gap-2">
                    <Icon icon="lucide:alert-circle" />
                    {error}
                  </p>
                </div>
              )}
              
              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="bordered"
                  onPress={() => navigate(-1)}
                  className="flex-1"
                  isDisabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="secondary"
                  className="flex-1 text-beamly-third"
                  isLoading={loading}
                  isDisabled={loading}
                >
                  {loading ? "Posting..." : "Post Job"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default PostJobPage;