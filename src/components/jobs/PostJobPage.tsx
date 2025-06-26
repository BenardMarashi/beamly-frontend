// src/pages/jobs/PostJobPage.tsx
import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { fns } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Button, 
  Input, 
  Textarea, 
  Select, 
  SelectItem,
  Card,
  CardBody,
  Chip,
  RadioGroup,
  Radio
} from '@nextui-org/react';
import { toast } from 'react-hot-toast';
import { Icon } from '@iconify/react';

const categories = [
  { value: 'development', label: 'Development' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'writing', label: 'Writing' },
  { value: 'video', label: 'Video & Animation' }
];

const experienceLevels = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' }
];

const projectSizes = [
  { value: 'small', label: 'Small', description: 'Quick task, less than 1 week' },
  { value: 'medium', label: 'Medium', description: '1-4 weeks project' },
  { value: 'large', label: 'Large', description: 'More than 1 month' }
];

export const PostJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    skills: [] as string[],
    budgetType: 'fixed',
    budgetMin: 0,
    budgetMax: 0,
    fixedPrice: 0,
    hourlyRate: 0,
    experienceLevel: 'intermediate',
    projectSize: 'medium',
    duration: '1-3 months',
    locationType: 'remote',
    location: ''
  });

  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const createJob = httpsCallable(fns, 'createJob');
      const result = await createJob(formData);
      
      if ((result.data as any).success) {
        toast.success('Job posted successfully!');
        navigate(`/jobs/${(result.data as any).jobId}`);
      }
    } catch (error: any) {
      console.error('Error posting job:', error);
      toast.error(error.message || 'Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.description && formData.category;
      case 2:
        return formData.skills.length > 0 && formData.experienceLevel;
      case 3:
        if (formData.budgetType === 'fixed') {
          return formData.fixedPrice > 0;
        } else {
          return formData.budgetMin > 0 && formData.budgetMax > 0;
        }
      default:
        return true;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Post a Job</h1>
        <p className="text-gray-400">Find the perfect freelancer for your project</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step <= currentStep ? 'bg-beamly-primary text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div className={`w-24 h-1 mx-2 ${
                step < currentStep ? 'bg-beamly-primary' : 'bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      <Card className="glass-card">
        <CardBody className="p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Input
                label="Job Title"
                placeholder="e.g., Full-Stack Developer for E-commerce Platform"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full"
                size="lg"
              />

              <Textarea
                label="Job Description"
                placeholder="Describe the project, requirements, and deliverables..."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, description: e.target.value })
                }
                minRows={5}
                className="w-full"
              />

              <Select
                label="Category"
                placeholder="Select a category"
                selectedKeys={formData.category ? [formData.category] : []}
                onSelectionChange={(keys: any) => {
                  const value = Array.from(keys)[0] as string;
                  setFormData({ ...formData, category: value });
                }}
                className="w-full"
              >
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}

          {/* Step 2: Skills & Requirements */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Required Skills</label>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Add a skill..."
                    value={newSkill}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSkill(e.target.value)}
                    onKeyPress={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    size="sm"
                  />
                  <Button
                    color="primary"
                    onClick={handleAddSkill}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <Chip
                      key={skill}
                      onClose={() => handleRemoveSkill(skill)}
                      variant="flat"
                    >
                      {skill}
                    </Chip>
                  ))}
                </div>
              </div>

              <RadioGroup
                label="Experience Level"
                value={formData.experienceLevel}
                onValueChange={(value: string) => setFormData({ ...formData, experienceLevel: value })}
              >
                {experienceLevels.map((level) => (
                  <Radio key={level.value} value={level.value}>
                    {level.label}
                  </Radio>
                ))}
              </RadioGroup>

              <RadioGroup
                label="Project Size"
                value={formData.projectSize}
                onValueChange={(value: string) => setFormData({ ...formData, projectSize: value })}
              >
                {projectSizes.map((size) => (
                  <Radio key={size.value} value={size.value}>
                    <div>
                      <div className="font-medium">{size.label}</div>
                      <div className="text-sm text-gray-400">{size.description}</div>
                    </div>
                  </Radio>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 3: Budget & Timeline */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <RadioGroup
                label="Budget Type"
                value={formData.budgetType}
                onValueChange={(value: string) => setFormData({ ...formData, budgetType: value })}
              >
                <Radio value="fixed">Fixed Price</Radio>
                <Radio value="hourly">Hourly Rate</Radio>
              </RadioGroup>

              {formData.budgetType === 'fixed' ? (
                <Input
                  type="number"
                  label="Fixed Price"
                  placeholder="Enter amount in USD"
                  value={formData.fixedPrice.toString()}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData({ ...formData, fixedPrice: parseInt(e.target.value) || 0 })
                  }
                  startContent={<span className="text-gray-400">$</span>}
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Min Hourly Rate"
                    placeholder="Min rate"
                    value={formData.budgetMin.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, budgetMin: parseInt(e.target.value) || 0 })
                    }
                    startContent={<span className="text-gray-400">$</span>}
                  />
                  <Input
                    type="number"
                    label="Max Hourly Rate"
                    placeholder="Max rate"
                    value={formData.budgetMax.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, budgetMax: parseInt(e.target.value) || 0 })
                    }
                    startContent={<span className="text-gray-400">$</span>}
                  />
                </div>
              )}

              <Select
                label="Project Duration"
                selectedKeys={[formData.duration]}
                onSelectionChange={(keys: any) => {
                  const value = Array.from(keys)[0] as string;
                  setFormData({ ...formData, duration: value });
                }}
              >
                <SelectItem key="less-than-1-month" value="less-than-1-month">
                  Less than 1 month
                </SelectItem>
                <SelectItem key="1-3-months" value="1-3-months">
                  1-3 months
                </SelectItem>
                <SelectItem key="3-6-months" value="3-6-months">
                  3-6 months
                </SelectItem>
                <SelectItem key="more-than-6-months" value="more-than-6-months">
                  More than 6 months
                </SelectItem>
              </Select>

              <RadioGroup
                label="Location Type"
                value={formData.locationType}
                onValueChange={(value: string) => setFormData({ ...formData, locationType: value })}
              >
                <Radio value="remote">Remote</Radio>
                <Radio value="onsite">On-site</Radio>
                <Radio value="hybrid">Hybrid</Radio>
              </RadioGroup>

              {formData.locationType !== 'remote' && (
                <Input
                  label="Location"
                  placeholder="e.g., New York, NY"
                  value={formData.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="flat"
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate('/dashboard')}
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            {currentStep < 3 ? (
              <Button
                color="primary"
                onClick={() => setCurrentStep(currentStep + 1)}
                isDisabled={!isStepValid()}
              >
                Next
                <Icon icon="lucide:arrow-right" className="ml-2" />
              </Button>
            ) : (
              <Button
                color="primary"
                onClick={handleSubmit}
                isLoading={loading}
                isDisabled={!isStepValid()}
              >
                Post Job
                <Icon icon="lucide:check" className="ml-2" />
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};