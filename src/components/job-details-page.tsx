import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, Card, CardBody, Chip, Divider, Spinner, Avatar } from "@heroui/react";
import { Icon } from "@iconify/react";
import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { JobApplicationModal } from "./job-application-modal";

interface JobDetailsPageProps {
  setCurrentPage: (page: string) => void;
  isDarkMode?: boolean;
}

interface JobDetails {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  clientPhotoURL: string;
  category: string;
  subcategory?: string;
  skills: string[];
  budgetType: 'fixed' | 'hourly';
  budgetMin: number;
  budgetMax: number;
  duration: string;
  experienceLevel: string;
  locationType: string;
  location?: string;
  projectSize: string;
  status: string;
  proposalCount: number;
  invitesSent: number;
  createdAt: any;
  updatedAt: any;
}

export const JobDetailsPage: React.FC<JobDetailsPageProps> = ({ 
  setCurrentPage,
  isDarkMode = true 
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchJobDetails();
      checkIfApplied();
    }
  }, [id]);
  
  const fetchJobDetails = async () => {
    if (!id) return;
    
    try {
      const jobDoc = await getDoc(doc(db, "jobs", id));
      
      if (jobDoc.exists()) {
        const data = jobDoc.data();
        setJobDetails({
          id: jobDoc.id,
          ...data
        } as JobDetails);
        
        // Increment view count
        await updateDoc(doc(db, "jobs", id), {
          viewCount: increment(1)
        });
      } else {
        toast.error("Job not found");
        navigate("/looking-for-work");
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };
  
  const checkIfApplied = async () => {
    if (!user || !id) return;
    
    try {
      const proposalsRef = collection(db, "proposals");
      const q = query(
        proposalsRef,
        where("jobId", "==", id),
        where("freelancerId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      setHasApplied(!snapshot.empty);
    } catch (error) {
      console.error("Error checking application status:", error);
    }
  };
  
  const handleApply = () => {
    if (!user) {
      toast.error("Please login to apply for jobs");
      navigate("/login");
      return;
    }
    
    if (user.uid === jobDetails?.clientId) {
      toast.error("You cannot apply to your own job");
      return;
    }
    
    if (hasApplied) {
      toast.error("You have already applied for this job");
      return;
    }
    
    setIsApplicationModalOpen(true);
  };
  
  const handleSaveJob = async () => {
    if (!user) {
      toast.error("Please login to save jobs");
      navigate("/login");
      return;
    }
    
    try {
      // TODO: Implement save job functionality
      toast.success("Job saved!");
    } catch (error) {
      toast.error("Failed to save job");
    }
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: jobDetails?.title,
        text: jobDetails?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };
  
  const formatBudget = () => {
    if (!jobDetails) return "";
    
    if (jobDetails.budgetType === 'fixed') {
      return `$${jobDetails.budgetMin} (Fixed Price)`;
    } else {
      return `$${jobDetails.budgetMin} - $${jobDetails.budgetMax}/hr`;
    }
  };
  
  const formatPostedDate = (timestamp: any) => {
    if (!timestamp) return "Recently";
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <Spinner color="secondary" size="lg" />
        </div>
      </div>
    );
  }
  
  if (!jobDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <Icon icon="lucide:file-x" className="mx-auto mb-4 text-4xl text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Job Not Found</h3>
          <Button
            color="secondary"
            onPress={() => navigate("/looking-for-work")}
          >
            Browse Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          variant="light"
          startContent={<Icon icon="lucide:arrow-left" />}
          onPress={() => navigate(-1)}
          className={isDarkMode ? "text-white" : "text-gray-800"}
        >
          Back
        </Button>
        
        <Card className={`glass-effect border-none mt-4 ${!isDarkMode && 'border border-gray-200'}`}>
          <CardBody className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
                  {jobDetails.title}
                </h1>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={jobDetails.clientPhotoURL || undefined}
                      name={jobDetails.clientName}
                      size="sm"
                    />
                    <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                      {jobDetails.clientName}
                    </span>
                  </div>
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>•</span>
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                    Posted {formatPostedDate(jobDetails.createdAt)}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Chip size="sm" className={isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"}>
                    {jobDetails.category}
                  </Chip>
                  {jobDetails.subcategory && (
                    <Chip size="sm" className={isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"}>
                      {jobDetails.subcategory}
                    </Chip>
                  )}
                  <Chip size="sm" className={isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"}>
                    {jobDetails.experienceLevel}
                  </Chip>
                  <Chip size="sm" className={isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"}>
                    {jobDetails.locationType === 'remote' ? 'Remote' : jobDetails.location || jobDetails.locationType}
                  </Chip>
                </div>
                
                <div className="text-beamly-secondary font-semibold text-xl">
                  {formatBudget()}
                </div>
              </div>
            </div>
            
            <Divider className={`my-6 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
            
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-3`}>
                  Description
                </h2>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-wrap`}>
                  {jobDetails.description}
                </p>
              </div>
              
              <div>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-3`}>
                  Skills Required
                </h2>
                <div className="flex flex-wrap gap-2">
                  {jobDetails.skills.map((skill, index) => (
                    <Chip key={index} variant="flat" color="secondary">
                      {skill}
                    </Chip>
                  ))}
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    Project Duration
                  </h3>
                  <p className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                    {jobDetails.duration}
                  </p>
                </div>
                
                <div>
                  <h3 className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    Project Size
                  </h3>
                  <p className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                    {jobDetails.projectSize}
                  </p>
                </div>
                
                <div>
                  <h3 className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    Experience Level
                  </h3>
                  <p className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                    {jobDetails.experienceLevel}
                  </p>
                </div>
                
                <div>
                  <h3 className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    Proposals
                  </h3>
                  <p className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                    {jobDetails.proposalCount} received
                  </p>
                </div>
              </div>
            </div>
            
            <Divider className={`my-6 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
            
            <div className="flex gap-3">
              <Button
                color="secondary"
                className="text-beamly-third font-medium flex-1"
                onPress={handleApply}
                isDisabled={hasApplied || jobDetails.status !== 'open'}
              >
                {hasApplied ? "Already Applied" : "Apply Now"}
              </Button>
              <Button
                variant="bordered"
                className={isDarkMode ? "text-white" : "text-gray-800"}
                startContent={<Icon icon="lucide:bookmark" />}
                onPress={handleSaveJob}
              >
                Save
              </Button>
              <Button
                variant="bordered"
                className={isDarkMode ? "text-white" : "text-gray-800"}
                startContent={<Icon icon="lucide:share-2" />}
                onPress={handleShare}
              >
                Share
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>
      
      {jobDetails && (
        <JobApplicationModal
          isOpen={isApplicationModalOpen}
          onClose={() => setIsApplicationModalOpen(false)}
          job={jobDetails}
          onSuccess={() => {
            setHasApplied(true);
            fetchJobDetails(); // Refresh job details to update proposal count
          }}
        />
      )}
    </div>
  );
};