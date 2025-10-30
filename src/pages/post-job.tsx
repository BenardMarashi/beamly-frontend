import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input, Textarea, Select, SelectItem, Button, Card, CardBody, Chip, RadioGroup, Radio } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

export const PostJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData, canPostJobs, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  // Check permissions on mount
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error(t('postJob.errors.loginRequired'));
        navigate('/login');
      } else if (!canPostJobs) {
        toast.error(t('postJob.errors.onlyClients', { userType: userData?.userType }));
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
    { value: "development", label: t('postJob.categories.development') },
    { value: "design", label: t('postJob.categories.design') },
    { value: "marketing", label: t('postJob.categories.marketing') },
    { value: "writing", label: t('postJob.categories.writing') },
    { value: "video", label: t('postJob.categories.video') },
    { value: "data-science", label: t('postJob.categories.dataScience') },
    { value: "business", label: t('postJob.categories.business') }
  ];
  
  const experienceLevels = [
    { value: "entry", label: t('postJob.experienceLevels.entry') },
    { value: "intermediate", label: t('postJob.experienceLevels.intermediate') },
    { value: "expert", label: t('postJob.experienceLevels.expert') }
  ];

  const durations = [
    { value: "less-than-week", label: t('postJob.durations.lessThanWeek') },
    { value: "1-2-weeks", label: t('postJob.durations.1to2weeks') },
    { value: "1-month", label: t('postJob.durations.1month') },
    { value: "1-3-months", label: t('postJob.durations.1to3months') },
    { value: "3-6-months", label: t('postJob.durations.3to6months') },
    { value: "more-than-6-months", label: t('postJob.durations.moreThan6months') }
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
      toast.error(t('postJob.errors.fillRequired'));
      return;
    }
    
    if (formData.skills.length === 0) {
      toast.error(t('postJob.errors.addSkill'));
      return;
    }
    
    if (formData.budgetType === 'fixed' && formData.fixedPrice <= 0) {
      toast.error(t('postJob.errors.validFixedPrice'));
      return;
    }
    
    if (formData.budgetType === 'hourly' && (formData.budgetMin <= 0 || formData.budgetMax <= 0)) {
      toast.error(t('postJob.errors.validHourlyRate'));
      return;
    }
    
    if (!formData.experienceLevel) {
      toast.error(t('postJob.errors.selectExperience'));
      return;
    }
    
    setLoading(true);
    
    try {
      const jobId = doc(collection(db, 'jobs')).id;
      
      const jobData = {
        id: jobId,
        clientId: user!.uid,
        clientName: userData?.displayName || t('common.anonymous'),
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
      
      toast.success(t('postJob.success.posted'));
      navigate('/job/manage');
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error(t('postJob.errors.postFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">{t('common.loading')}</p>
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
        <h1 className="text-3xl font-bold text-white mb-8">{t('postJob.title')}</h1>
        
        <form onSubmit={handleSubmit}>
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{t('postJob.jobDetails')}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postJob.jobTitle')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder={t('postJob.jobTitlePlaceholder')}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    variant="bordered"
                    className="text-white"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postJob.jobDescription')} <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder={t('postJob.jobDescriptionPlaceholder')}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    variant="bordered"
                    className="text-white"
                    minRows={6}
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postJob.category')} <span className="text-red-500">*</span>
                  </label>
                  <Select
                    placeholder={t('postJob.selectCategory')}
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
                  >
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{t('postJob.skillsExperience')}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postJob.requiredSkills')} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder={t('postJob.addSkillPlaceholder')}
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
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postJob.experienceLevel')} <span className="text-red-500">*</span>
                  </label>
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
                <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  {t('postJob.projectDuration')} <span className="text-red-500">*</span>
                </label>
                <Select
                  placeholder={t('postJob.selectDuration')}
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
              </div>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{t('postJob.budget')}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postJob.budgetType')}
                  </label>
                <RadioGroup
                  value={formData.budgetType}
                  onValueChange={(value) => setFormData({ ...formData, budgetType: value })}
                  orientation="horizontal"
                  className="text-white"
                >
                  <Radio value="fixed" className="text-white">{t('postJob.fixedPrice')}</Radio>
                  <Radio value="hourly" className="text-white">{t('postJob.hourlyRate')}</Radio>
                </RadioGroup>
                
                {formData.budgetType === 'fixed' ? (
                  <div>
                    <label className="text-white text-sm font-medium mb-2 block">
                      {t('postJob.fixedPriceAmount')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      // Remove this label prop
                      placeholder={t('postJob.enterAmount')}
                      value={formData.fixedPrice.toString()}
                      onChange={(e) => setFormData({ ...formData, fixedPrice: parseFloat(e.target.value) || 0 })}
                      variant="bordered"
                      className="text-white"
                      startContent={<span className="text-gray-400">€</span>}
                      // Remove isRequired
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">
                        {t('postJob.minHourlyRate')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        // Remove label prop
                        placeholder={t('postJob.min')}
                        value={formData.budgetMin.toString()}
                        onChange={(e) => setFormData({ ...formData, budgetMin: parseFloat(e.target.value) || 0 })}
                        variant="bordered"
                        className="text-white"
                        startContent={<span className="text-gray-400">€</span>}
                        // Remove isRequired
                      />
                    </div>
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">
                        {t('postJob.maxHourlyRate')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        // Remove label prop
                        placeholder={t('postJob.max')}
                        value={formData.budgetMax.toString()}
                        onChange={(e) => setFormData({ ...formData, budgetMax: parseFloat(e.target.value) || 0 })}
                        variant="bordered"
                        className="text-white"
                        startContent={<span className="text-gray-400">€</span>}
                        // Remove isRequired
                      />
                    </div>
                  </div>
                )}
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
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              color="primary"
              className="flex-1"
              isLoading={loading}
            >
              {t('postJob.postJobButton')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PostJobPage;