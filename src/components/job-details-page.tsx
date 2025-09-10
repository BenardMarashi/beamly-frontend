import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardBody, Button, Chip, Avatar, Skeleton, Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { PageHeader } from "./page-header";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface JobDetails {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetType: 'fixed' | 'hourly';
  budgetMin: number;
  budgetMax?: number;
  skills: string[];
  experienceLevel: string;
  projectDuration: string;
  attachments?: string[];
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  clientRating?: number;
  clientJobsPosted?: number;
  clientCountry?: string;
  postedAt: any;
  proposals: number;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
}

interface JobDetailsPageProps {
  isDarkMode?: boolean;
}

export const JobDetailsPage: React.FC<JobDetailsPageProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const isFreelancer = userData?.userType === 'freelancer' || userData?.userType === 'both';

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const jobDoc = await getDoc(doc(db, 'jobs', id));
      if (jobDoc.exists()) {
        setJob({ id: jobDoc.id, ...jobDoc.data() } as JobDetails);
      } else {
        toast.error(t('jobDetails.errors.jobNotFound'));
        navigate('/looking-for-work');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error(t('jobDetails.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

const handleApply = () => {
  if (!user) {
    toast.error(t('jobDetails.errors.loginToApply'));
    navigate('/login');
    return;
  }
  
  if (!isFreelancer) {
    toast.error(t('jobDetails.errors.onlyFreelancers'));
    return;
  }
  
  // Navigate to the apply page instead of opening modal
  navigate(`/job/${id}/apply`);
};

  const formatBudget = () => {
    if (!job) return '';
    
    if (job.budgetType === 'fixed') {
      return `€${job.budgetMin}`;
    } else {
      return `€${job.budgetMin} - €${job.budgetMax}/hr`;
    }
  };

  const formatPostedDate = (date: any) => {
    if (!date) return 'Recently';
    const postedDate = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <PageHeader 
          title={t('jobDetails.loading.title')}
          subtitle={t('jobDetails.loading.subtitle')}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="glass-effect">
              <CardBody className="space-y-4">
                <Skeleton className="h-8 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3 rounded-lg" />
              </CardBody>
            </Card>
          </div>
          <div>
            <Card className="glass-effect">
              <CardBody className="space-y-4">
                <Skeleton className="h-6 w-1/2 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <PageHeader 
          title={t('jobDetails.notFound.title')}
          subtitle={t('jobDetails.notFound.subtitle')}
        />
        <div className="text-center">
          <Button 
            color="secondary"
            onPress={() => navigate('/looking-for-work')}
          >
            {t('jobDetails.browseJobs')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="breadcrumb-container" style={{ marginBottom: '3rem' }}>
        <Breadcrumbs>
          <BreadcrumbItem onPress={() => navigate('/')}>{t('jobDetails.breadcrumb.home')}</BreadcrumbItem>
          <BreadcrumbItem onPress={() => navigate('/looking-for-work')}>{t('jobDetails.breadcrumb.jobs')}</BreadcrumbItem>
          <BreadcrumbItem>{job.title}</BreadcrumbItem>
        </Breadcrumbs>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="glass-effect">
              <CardBody className="p-6">
                <h1 className="text-2xl font-bold text-white mb-4">{job.title}</h1>
                
                <div className="flex flex-wrap gap-2 mb-6">
                    <Chip 
                      color="secondary" 
                      variant="flat"
                      className="flex items-center"
                    >
                      <div className="flex items-center gap-1">
                        <Icon icon="lucide:folder" className="w-4 h-4" />
                        <span>{job.category}</span>
                      </div>
                    </Chip>
                    <Chip 
                      variant="flat"
                      className="flex items-center"
                    >
                      <div className="flex items-center gap-1">
                        <Icon icon="lucide:clock" className="w-4 h-4" />
                        <span>{formatPostedDate(job.postedAt)}</span>
                      </div>
                    </Chip>
                  </div>
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-3">{t('jobDetails.description')}</h2>
                    <p className="text-gray-300 whitespace-pre-wrap">{job.description}</p>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-white mb-3">{t('jobDetails.skillsRequired')}</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <Chip key={skill} variant="flat">{skill}</Chip>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-gray-400 mb-1">{t('jobDetails.experienceLevel')}</h3>
                      <p className="text-white capitalize">{job.experienceLevel}</p>
                    </div>
                    <div>
                      <h3 className="text-gray-400 mb-1">{t('jobDetails.projectDuration')}</h3>
                      <p className="text-white">{job.projectDuration}</p>
                    </div>
                  </div>

                  {job.attachments && job.attachments.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-3">{t('jobDetails.attachments')}</h2>
                      <div className="space-y-2">
                        {job.attachments.map((_, index) => (
                          <div key={index} className="flex items-center gap-2 text-gray-300">
                            <Icon icon="lucide:paperclip" />
                            <span>{t('jobDetails.attachment')} {index + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="glass-effect">
              <CardBody className="p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-400 mb-2">{t('jobDetails.budget')}</p>
                  <p className="text-3xl font-bold text-white">{formatBudget()}</p>
                  <p className="text-sm text-gray-400 capitalize">{t(`jobDetails.${job.budgetType}Price`)}</p>
                </div>

                {isFreelancer && (
                  <Button
                    color="secondary"
                    size="lg"
                    className="w-full mb-4"
                    onPress={handleApply}
                  >
                    {t('jobDetails.applyNow')}
                  </Button>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t('jobDetails.proposals')}</span>
                    <span className="text-white">{job.proposals}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t('jobDetails.status')}</span>
                    <Chip
                      size="sm"
                      color={job.status === 'open' ? 'success' : 'default'}
                      variant="flat"
                    >
                      {job.status}
                    </Chip>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="glass-effect">
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t('jobDetails.aboutClient')}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar
                    src={job.clientAvatar}
                    name={job.clientName}
                    size="lg"
                  />
                  <div>
                    <p className="text-white font-medium">{job.clientName}</p>
                    {job.clientRating && (
                      <div className="flex items-center gap-1">
                        <Icon icon="lucide:star" className="text-yellow-500" />
                        <span className="text-gray-400">{job.clientRating}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {job.clientJobsPosted && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t('jobDetails.jobsPosted')}</span>
                      <span className="text-white">{job.clientJobsPosted}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
    </div>
  );
};