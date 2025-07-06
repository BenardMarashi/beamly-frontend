import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Chip, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { collection, query, where, orderBy, limit, getDocs, DocumentData, startAfter } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "react-hot-toast";

interface LookingForWorkPageProps {
  setCurrentPage: (page: string) => void;
  isDarkMode?: boolean;
}

interface Job extends DocumentData {
  id: string;
  title: string;
  clientName: string;
  clientPhotoURL: string;
  budgetMin: number;
  budgetMax: number;
  budgetType: 'fixed' | 'hourly';
  locationType: string;
  location?: string;
  createdAt: any;
  category: string;
  description: string;
  skills: string[];
  experienceLevel: string;
}

export const LookingForWorkPage: React.FC<LookingForWorkPageProps> = ({ 
  setCurrentPage,
  isDarkMode = true
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const { t } = useTranslation();
  
  const categories = [
    { id: "all", name: t('lookingForWork.filterCategories.all') },
    { id: "design", name: t('lookingForWork.filterCategories.design') },
    { id: "development", name: t('lookingForWork.filterCategories.development') },
    { id: "marketing", name: t('lookingForWork.filterCategories.marketing') },
    { id: "writing", name: t('lookingForWork.filterCategories.writing') },
    { id: "video", name: t('lookingForWork.filterCategories.video') }
  ];
  
  useEffect(() => {
    fetchJobs(true);
  }, [filterCategory, sortBy]);
  
  const fetchJobs = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setJobs([]);
        setLastDoc(null);
      } else {
        setLoadingMore(true);
      }
      
      // Build query
      let q = query(
        collection(db, "jobs"),
        where("status", "==", "open")
      );
      
      // Apply category filter
      if (filterCategory !== "all") {
        q = query(q, where("category", "==", filterCategory));
      }
      
      // Apply sorting
      switch (sortBy) {
        case "newest":
          q = query(q, orderBy("createdAt", "desc"));
          break;
        case "budgetHigh":
          q = query(q, orderBy("budgetMax", "desc"));
          break;
        case "budgetLow":
          q = query(q, orderBy("budgetMin", "asc"));
          break;
        default:
          q = query(q, orderBy("createdAt", "desc"));
      }
      
      // Pagination
      if (!reset && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      q = query(q, limit(10));
      
      const querySnapshot = await getDocs(q);
      
      const fetchedJobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      
      if (reset) {
        setJobs(fetchedJobs);
      } else {
        setJobs(prev => [...prev, ...fetchedJobs]);
      }
      
      // Update pagination
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);
      setHasMore(querySnapshot.docs.length === 10);
      
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  const handleSearch = () => {
    // Filter jobs based on search query
    if (!searchQuery.trim()) {
      fetchJobs(true);
      return;
    }
    
    const filtered = jobs.filter(job => 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    setJobs(filtered);
  };
  
  const handleViewJobDetails = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };
  
  const formatBudget = (job: Job) => {
    if (job.budgetType === 'fixed') {
      return `$${job.budgetMin}`;
    } else {
      return `$${job.budgetMin} - $${job.budgetMax}/hr`;
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {t('lookingForWork.title')}
        </h1>
        <p className={isDarkMode ? "text-gray-300 mt-2" : "text-gray-600 mt-2"}>
          {t('lookingForWork.subtitle')}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Input
          placeholder={t('lookingForWork.searchPlaceholder')}
          value={searchQuery}
          onValueChange={setSearchQuery}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          startContent={<Icon icon="lucide:search" className="text-gray-400" />}
          className="flex-1"
          variant="bordered"
        />
        <Button 
          color="secondary" 
          className="text-beamly-third font-medium"
          onPress={handleSearch}
        >
          {t('lookingForWork.searchButton')}
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex gap-2 flex-wrap flex-1">
          {categories.map((category) => (
            <Button
              key={category.id}
              size="sm"
              variant={filterCategory === category.id ? "solid" : "flat"}
              color={filterCategory === category.id ? "secondary" : "default"}
              className={filterCategory === category.id ? "text-beamly-third" : ""}
              onPress={() => setFilterCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
        
        <Dropdown>
          <DropdownTrigger>
            <Button 
              variant="flat"
              endContent={<Icon icon="lucide:chevron-down" />}
              className={isDarkMode ? 'text-white' : 'text-gray-800'}
            >
              {t('lookingForWork.sortBy.title')}
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Sort options"
            onAction={(key) => setSortBy(key as string)}
            selectedKeys={[sortBy]}
            selectionMode="single"
            className={
              isDarkMode ? 
              "bg-[#010b29]/95 backdrop-blur-md border border-white/10" : 
              "bg-white/95 backdrop-blur-md border border-gray-200"
            }
          >
            <DropdownItem key="newest" className={isDarkMode ? 'text-white' : 'text-gray-800'}>
              {t('lookingForWork.sortBy.recent')}
            </DropdownItem>
            <DropdownItem key="budgetHigh" className={isDarkMode ? 'text-white' : 'text-gray-800'}>
              {t('lookingForWork.sortBy.salaryHigh')}
            </DropdownItem>
            <DropdownItem key="budgetLow" className={isDarkMode ? 'text-white' : 'text-gray-800'}>
              {t('lookingForWork.sortBy.salaryLow')}
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner color="secondary" size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card 
                  className={`${index % 2 === 0 ? 'glass-card' : 'yellow-glass'} border-none card-hover ${!isDarkMode && 'border border-gray-200'}`}
                  isPressable
                  onPress={() => handleViewJobDetails(job.id)}
                >
                  <div className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} flex items-center justify-center`}>
                        {job.clientPhotoURL ? (
                          <img 
                            src={job.clientPhotoURL} 
                            alt={job.clientName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <Icon icon="lucide:user" className="text-gray-400" width={24} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {job.title}
                        </h3>
                        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                          {job.clientName}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Chip 
                            size="sm"
                            className={isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'}
                          >
                            {job.experienceLevel}
                          </Chip>
                          <Chip 
                            size="sm"
                            className={isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'}
                          >
                            {job.locationType === 'remote' ? 'Remote' : job.location || job.locationType}
                          </Chip>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-beamly-secondary font-bold">
                          {formatBudget(job)}
                        </div>
                        <div className={isDarkMode ? "text-gray-400 text-xs" : "text-gray-500 text-xs"}>
                          {formatPostedDate(job.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
                      {job.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {job.skills.slice(0, 3).map((skill, idx) => (
                        <Chip key={idx} size="sm" variant="flat" className="text-xs">
                          {skill}
                        </Chip>
                      ))}
                      {job.skills.length > 3 && (
                        <Chip size="sm" variant="flat" className="text-xs">
                          +{job.skills.length - 3}
                        </Chip>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="light"
                          size="sm"
                          className={isDarkMode ? 'text-white' : 'text-gray-800'}
                          startContent={<Icon icon="lucide:bookmark" />}
                          onPress={() => {
                            // TODO: Implement save functionality
                            toast.success("Job saved!");
                          }}
                        >
                          {t('lookingForWork.jobCard.save')}
                        </Button>
                      </div>
                      <Button 
                        color="secondary"
                        size="sm"
                        className="text-beamly-third font-medium"
                        onPress={() => handleViewJobDetails(job.id)}
                      >
                        {t('lookingForWork.jobCard.viewDetails')}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {jobs.length === 0 && (
            <div className={`text-center py-12 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <Icon icon="lucide:search" className="mx-auto mb-4 text-4xl text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">{t('lookingForWork.noJobsFound.title')}</h3>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>{t('lookingForWork.noJobsFound.description')}</p>
            </div>
          )}
          
          {hasMore && jobs.length > 0 && (
            <div className="flex justify-center mt-10">
              <Button 
                color="primary"
                variant="bordered"
                className={isDarkMode ? "text-white border-white/30" : "text-beamly-primary border-beamly-primary/30"}
                onPress={() => fetchJobs(false)}
                isLoading={loadingMore}
              >
                {t('lookingForWork.loadMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};