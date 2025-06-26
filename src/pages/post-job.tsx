import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input, Textarea, Select, SelectItem, Button, Card, CardBody, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";
import { JobService } from "../services/firebase-services";
import { useAuth } from "../hooks/use-auth";

export const PostJobPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
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
    fixedPrice: "",
    hourlyRateMin: "",
    hourlyRateMax: "",
    duration: "",
    experienceLevel: "",
    locationType: "remote",
    location: "",
    attachments: [] as File[]
  });
  
  const [currentSkill, setCurrentSkill] = useState("");
  
  const categories = [
    { value: "web-development", label: "Web Development" },
    { value: "mobile-development", label: "Mobile Development" },
    { value: "design", label: "Design" },
    { value: "writing", label: "Writing" },
    { value: "marketing", label: "Marketing" },
    { value: "video-animation", label: "Video & Animation" },
    { value: "music-audio", label: "Music & Audio" },
    { value: "programming", label: "Programming" },
    { value: "business", label: "Business" },
    { value: "data-science", label: "Data Science" }
  ];
  
  const experienceLevels = [
    { value: "entry", label: "Entry Level" },
    { value: "intermediate", label: "Intermediate" },
    { value: "expert", label: "Expert" }
  ];
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    if (formData.skills.length === 0) return "Please add at least one required skill";
    if (!formData.experienceLevel) return "Please select experience level";
    
    if (formData.budgetType === "fixed") {
      if (!formData.fixedPrice || parseFloat(formData.fixedPrice) <= 0) {
        return "Please enter a valid fixed price";
      }
    } else {
      if (!formData.hourlyRateMin || !formData.hourlyRateMax) {
        return "Please enter both minimum and maximum hourly rates";
      }
      if (parseFloat(formData.hourlyRateMin) >= parseFloat(formData.hourlyRateMax)) {
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
      return;
    }
    
    if (!user) {
      setError("You must be logged in to post a job");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const jobData = {
        ...formData,
        clientId: user.uid,
        clientName: user.displayName || "Anonymous",
        clientPhotoURL: user.photoURL || "",
        budgetMin: formData.budgetType === "hourly" ? parseFloat(formData.hourlyRateMin) : parseFloat(formData.fixedPrice),
        budgetMax: formData.budgetType === "hourly" ? parseFloat(formData.hourlyRateMax) : parseFloat(formData.fixedPrice),
        status: "open",
        featured: false,
        urgent: false,
        verified: true
      };
      
      const result = await JobService.createJob(jobData);
      
      if (result.success) {
        navigate(`/job/${result.jobId}`);
      } else {
        setError("Failed to create job. Please try again.");
      }
    } catch (err) {
      console.error("Error posting job:", err);
      setError("An error occurred while posting the job.");
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
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Post a New Job
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Find the perfect freelancer for your project
          </p>
        </div>
        
        <Card className={`${isDarkMode ? 'glass-card' : 'bg-white'} border-none`}>
          <CardBody className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Title */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Job Title *
                </label>
                <Input
                  placeholder="e.g., Build a WordPress website"
                  value={formData.title}
                  onValueChange={(value) => handleInputChange("title", value)}
                  variant="bordered"
                  className={isDarkMode ? "bg-white/10" : ""}
                  isRequired
                />
              </div>
              
              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Job Description *
                </label>
                <Textarea
                  placeholder="Describe your project in detail..."
                  value={formData.description}
                  onValueChange={(value) => handleInputChange("description", value)}
                  variant="bordered"
                  minRows={6}
                  className={isDarkMode ? "bg-white/10" : ""}
                  isRequired
                />
              </div>
              
              {/* Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Category *
                  </label>
                  <Select
                    placeholder="Select category"
                    selectedKeys={formData.category ? [formData.category] : []}
                    onSelectionChange={(keys) => handleInputChange("category", Array.from(keys)[0])}
                    variant="bordered"
                    className={isDarkMode ? "bg-white/10" : ""}
                    isRequired
                  >
                    {categories.map(cat => (
                      <SelectItem key={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Experience Level *
                  </label>
                  <Select
                    placeholder="Select experience level"
                    selectedKeys={formData.experienceLevel ? [formData.experienceLevel] : []}
                    onSelectionChange={(keys) => handleInputChange("experienceLevel", Array.from(keys)[0])}
                    variant="bordered"
                    className={isDarkMode ? "bg-white/10" : ""}
                    isRequired
                  >
                    {experienceLevels.map(level => (
                      <SelectItem key={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
              
              {/* Skills */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Required Skills *
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a skill..."
                    value={currentSkill}
                    onValueChange={setCurrentSkill}
                    variant="bordered"
                    className={isDarkMode ? "bg-white/10" : ""}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button
                    type="button"
                    color="secondary"
                    onPress={addSkill}
                    className="text-beamly-third"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map(skill => (
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
              
              {/* Budget */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Budget Type *
                </label>
                <div className="flex gap-4 mb-4">
                  <Button
                    type="button"
                    variant={formData.budgetType === "fixed" ? "solid" : "bordered"}
                    color={formData.budgetType === "fixed" ? "secondary" : "default"}
                    onPress={() => handleInputChange("budgetType", "fixed")}
                    className={formData.budgetType === "fixed" ? "text-beamly-third" : ""}
                  >
                    Fixed Price
                  </Button>
                  <Button
                    type="button"
                    variant={formData.budgetType === "hourly" ? "solid" : "bordered"}
                    color={formData.budgetType === "hourly" ? "secondary" : "default"}
                    onPress={() => handleInputChange("budgetType", "hourly")}
                    className={formData.budgetType === "hourly" ? "text-beamly-third" : ""}
                  >
                    Hourly Rate
                  </Button>
                </div>
                
                {formData.budgetType === "fixed" ? (
                  <Input
                    type="number"
                    placeholder="Enter fixed price"
                    value={formData.fixedPrice}
                    onValueChange={(value) => handleInputChange("fixedPrice", value)}
                    variant="bordered"
                    startContent="$"
                    className={isDarkMode ? "bg-white/10" : ""}
                    isRequired
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      placeholder="Min hourly rate"
                      value={formData.hourlyRateMin}
                      onValueChange={(value) => handleInputChange("hourlyRateMin", value)}
                      variant="bordered"
                      startContent="$"
                      className={isDarkMode ? "bg-white/10" : ""}
                      isRequired
                    />
                    <Input
                      type="number"
                      placeholder="Max hourly rate"
                      value={formData.hourlyRateMax}
                      onValueChange={(value) => handleInputChange("hourlyRateMax", value)}
                      variant="bordered"
                      startContent="$"
                      className={isDarkMode ? "bg-white/10" : ""}
                      isRequired
                    />
                  </div>
                )}
              </div>
              
              {/* Location */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Location Type *
                </label>
                <div className="flex gap-4 mb-4">
                  <Button
                    type="button"
                    variant={formData.locationType === "remote" ? "solid" : "bordered"}
                    color={formData.locationType === "remote" ? "secondary" : "default"}
                    onPress={() => handleInputChange("locationType", "remote")}
                    className={formData.locationType === "remote" ? "text-beamly-third" : ""}
                  >
                    Remote
                  </Button>
                  <Button
                    type="button"
                    variant={formData.locationType === "onsite" ? "solid" : "bordered"}
                    color={formData.locationType === "onsite" ? "secondary" : "default"}
                    onPress={() => handleInputChange("locationType", "onsite")}
                    className={formData.locationType === "onsite" ? "text-beamly-third" : ""}
                  >
                    On-site
                  </Button>
                  <Button
                    type="button"
                    variant={formData.locationType === "hybrid" ? "solid" : "bordered"}
                    color={formData.locationType === "hybrid" ? "secondary" : "default"}
                    onPress={() => handleInputChange("locationType", "hybrid")}
                    className={formData.locationType === "hybrid" ? "text-beamly-third" : ""}
                  >
                    Hybrid
                  </Button>
                </div>
                
                {formData.locationType !== "remote" && (
                  <Input
                    placeholder="Enter location"
                    value={formData.location}
                    onValueChange={(value) => handleInputChange("location", value)}
                    variant="bordered"
                    className={isDarkMode ? "bg-white/10" : ""}
                    isRequired
                  />
                )}
              </div>
              
              {/* Duration */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Project Duration
                </label>
                <Input
                  placeholder="e.g., 2 weeks, 3 months"
                  value={formData.duration}
                  onValueChange={(value) => handleInputChange("duration", value)}
                  variant="bordered"
                  className={isDarkMode ? "bg-white/10" : ""}
                />
              </div>
              
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
                  Post Job
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