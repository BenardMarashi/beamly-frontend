import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Card, 
  CardBody, 
  Button, 
  Input, 
  Select, 
  SelectItem,
  Chip,
  Skeleton,
  Avatar
} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  DocumentSnapshot,
  startAfter,
  QueryConstraint
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { PageHeader } from "./page-header";
import { formatNameWithInitial } from '../utils/nameFormatter';

interface Job {
  id: string;
  title: string;
  company: string;
  clientName?: string;
  clientPhotoURL?: string;
  description: string;
  budget?: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetRange?: string;
  fixedPrice?: number;
  category?: string;
  skills?: string[];
  duration?: string;
  postedAt?: any;
  createdAt?: any;
  location?: string;
  type?: string;
  status?: string;
  proposalsCount?: number;
}
interface LookingForWorkPageProps {
  setCurrentPage?: (page: string) => void;
  isDarkMode?: boolean;
}

export const LookingForWorkPage: React.FC<LookingForWorkPageProps> = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBudget, setSelectedBudget] = useState("all");
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [currentPage, setCurrentPageNum] = useState(1);
  const [displayedCount, setDisplayedCount] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const jobsPerPage = 9;

  const categories = [
    { value: "all", label: t('lookingForWork.categories.all') },
    { value: "development", label: t('lookingForWork.categories.webDevelopment') },
    { value: "design", label: t('lookingForWork.categories.graphicDesign') },
    { value: "marketing", label: t('lookingForWork.categories.digitalMarketing') },
    { value: "writing", label: t('lookingForWork.categories.writing') },
    { value: "video", label: t('lookingForWork.categories.videoAnimation') },
    { value: "data-science", label: t('lookingForWork.categories.dataScience') },
    { value: "business", label: t('lookingForWork.categories.business') }
  ];

  const budgetRanges = [
    { value: "all", label: t('lookingForWork.budget.all') },
    { value: "0-500", label: t('lookingForWork.budget.under500') },
    { value: "500-1000", label: t('lookingForWork.budget.500to1000') },
    { value: "1000-5000", label: t('lookingForWork.budget.1000to5000') },
    { value: "5000+", label: t('lookingForWork.budget.5000plus') }
  ];

  const durations = [
    { value: "all", label: t('lookingForWork.duration.all') },
    { value: "less-than-week", label: t('lookingForWork.duration.lessWeek') },
    { value: "1-2-weeks", label: "1-2 Weeks" },
    { value: "1-month", label: "1 Month" },
    { value: "1-3-months", label: t('lookingForWork.duration.1to3months') },
    { value: "3-6-months", label: t('lookingForWork.duration.3to6months') },
    { value: "more-than-6-months", label: t('lookingForWork.duration.6plusMonths') }
  ];

  const popularSkills = [
    "React", "Node.js", "Python", "UI/UX Design", 
    "WordPress", "SEO", "Content Writing", "Video Editing"
  ];

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPageNum(1);
    setDisplayedCount(9);
    lastDocRef.current = null;
  }, [selectedCategory, selectedBudget, selectedDuration, searchQuery]);

  useEffect(() => {
    const shouldReset = currentPage === 1;
    fetchJobs(shouldReset);
  }, [selectedCategory, selectedBudget, selectedDuration, currentPage, searchQuery]);

const fetchJobs = async (reset = false) => {
  setLoading(true);
  
  if (reset) {
    lastDocRef.current = null;
  }
  
  try {
    // ✅ MINIMAL CONSTRAINTS - Only what Firestore can handle
    const constraints: QueryConstraint[] = [
      where("status", "==", "open"),
      orderBy("createdAt", "desc")
    ];

    // ✅ Only add category filter (equality filter works fine)
    if (selectedCategory !== "all") {
      constraints.push(where("category", "==", selectedCategory));
    }

    // ❌ REMOVE BUDGET FILTER - Will filter in memory
    // ❌ REMOVE DURATION FILTER - Will filter in memory

    // Fetch more to compensate for in-memory filtering
    const fetchLimit = jobsPerPage * 3; // Fetch 3x to account for filters

    if (!reset && lastDocRef.current) {
      constraints.push(startAfter(lastDocRef.current));
    }

    constraints.push(limit(fetchLimit));

    const q = query(collection(db, "jobs"), ...constraints);
    const querySnapshot = await getDocs(q);
    
    let jobsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Job));

    console.log("📊 Fetched jobs:", jobsData.length);

    // ✅ FILTER BUDGET IN MEMORY
    if (selectedBudget !== "all") {
      jobsData = jobsData.filter(job => {
        if (selectedBudget === "5000+") {
          return (job.budgetMin && job.budgetMin >= 5000) || (job.budgetMax && job.budgetMax >= 5000);
        } else {
          const [minStr, maxStr] = selectedBudget.split("-");
          const min = parseInt(minStr);
          const max = parseInt(maxStr);
          
          // Check if job budget overlaps with selected range
          const jobMin = job.budgetMin || 0;
          const jobMax = job.budgetMax || job.budgetMin || 0;
          
          return jobMin <= max && jobMax >= min;
        }
      });
      console.log(`💰 After budget filter (${selectedBudget}):`, jobsData.length);
    }

    // ✅ FILTER DURATION IN MEMORY
    if (selectedDuration !== "all") {
      jobsData = jobsData.filter(job => job.duration === selectedDuration);
      console.log(`⏱️ After duration filter (${selectedDuration}):`, jobsData.length);
    }

    // ✅ FILTER SEARCH IN MEMORY
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      jobsData = jobsData.filter(job => 
        job.title?.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower) ||
        job.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
        job.category?.toLowerCase().includes(searchLower) ||
        job.company?.toLowerCase().includes(searchLower) ||
        job.clientName?.toLowerCase().includes(searchLower)
      );
      console.log(`🔍 After search filter (${searchQuery}):`, jobsData.length);
    }

    // Limit to jobsPerPage after all filtering
    console.log("✅ Total jobs available:", jobsData.length);

if (reset) {
  setJobs(jobsData);
} else {
  // Avoid duplicates when loading more
  setJobs(prev => {
    const existingIds = new Set(prev.map(j => j.id));
    const newJobs = jobsData.filter(j => !existingIds.has(j.id));
    return [...prev, ...newJobs];
  });
}

    if (querySnapshot.docs.length > 0) {
      lastDocRef.current = querySnapshot.docs[querySnapshot.docs.length - 1];
    }

    // Update pagination
  } catch (error) {
    console.error("❌ Error fetching jobs:", error);
    setJobs([]);
  } finally {
    setLoading(false);
  }
};

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPageNum(1);
    fetchJobs(true);
  };

  const handleSkillClick = (skill: string) => {
    setSearchQuery(skill);
    setCurrentPageNum(1);
  };

  const formatBudget = (job: Job) => {
    // Check for pre-formatted budget string
    if (job.budget) return job.budget;
    if (job.budgetRange) return job.budgetRange;
    
    // Check for fixed price
    if (job.fixedPrice) return `€${job.fixedPrice}`;
    
    // ✅ FIX #6: Improved budget range formatting
    // Only show range if min and max are different
    if (job.budgetMin && job.budgetMax && job.budgetMin !== job.budgetMax) {
      return `€${job.budgetMin} - €${job.budgetMax}`;
    }
    
    // Show minimum if available
    if (job.budgetMin) return `€${job.budgetMin}+`;
    
    // Show maximum if available
    if (job.budgetMax) return `€${job.budgetMax}`;
    
    // Default to negotiable
    return t('lookingForWork.negotiable');
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return t('common.recently');
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return t('common.justNow');
      if (diffInHours < 24) return t('common.hoursAgo', { hours: diffInHours });
      if (diffInHours < 168) return t('common.daysAgo', { days: Math.floor(diffInHours / 24) });
      return t('common.weeksAgo', { weeks: Math.floor(diffInHours / 168) });
    } catch (error) {
      return t('common.recently');
    }
  };

  const displayedJobs = jobs.slice(0, displayedCount);
const canLoadMore = displayedCount < jobs.length || currentPage < totalPages;

const handleLoadMore = () => {
  if (displayedCount < jobs.length) {
    setDisplayedCount(prev => prev + 9);
  } else if (currentPage < totalPages) {
    setCurrentPageNum(currentPage + 1);
    setDisplayedCount(prev => prev + 9);
  }
};

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title={t('lookingForWork.title')}
        subtitle={t('lookingForWork.subtitle')}
      />

      {/* Search and Filters */}
        <div className="glass-effect p-4 md:p-6 rounded-xl mb-8">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex flex-row gap-2" style={{ flexWrap: 'nowrap' }}>
              <Input
                placeholder={t('lookingForWork.searchPlaceholder')}
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="flex-1"
                startContent={<Icon icon="lucide:search" />}
                classNames={{
                  inputWrapper: "bg-white/5"
                }}
              />
              <Button 
                type="submit"
                color="secondary" 
                className="text-beamly-third font-medium"
                startContent={<Icon icon="lucide:search" />}
              >
                {t('lookingForWork.searchButton')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label={t('lookingForWork.filters.category')}
                selectedKeys={[selectedCategory]}
                onChange={(e) => setSelectedCategory(e.target.value)}
                classNames={{
                  trigger: "bg-white/5",
                  value: "text-white",
                  label: "text-gray-400"
                }}
              >
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label={t('lookingForWork.filters.budgetRange')}
                selectedKeys={[selectedBudget]}
                onChange={(e) => setSelectedBudget(e.target.value)}
                classNames={{
                  trigger: "bg-white/5",
                  value: "text-white",
                  label: "text-gray-400"
                }}
              >
                {budgetRanges.map((budget) => (
                  <SelectItem key={budget.value} value={budget.value}>
                    {budget.label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label={t('lookingForWork.filters.duration')}
                selectedKeys={[selectedDuration]}
                onChange={(e) => setSelectedDuration(e.target.value)}
                classNames={{
                  trigger: "bg-white/5",
                  value: "text-white",
                  label: "text-gray-400"
                }}
              >
                {durations.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value}>
                    {duration.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </form>
        </div>

      {/* Popular Skills */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">{t('lookingForWork.popularSkills')}</h3>
        <div className="flex flex-wrap gap-2">
          {popularSkills.map((skill) => (
            <Chip
              key={skill}
              variant="flat"
              className="bg-white/10 hover:bg-white/20 cursor-pointer transition-colors"
              onClick={() => handleSkillClick(skill)}
            >
              {skill}
            </Chip>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      {loading && jobs.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-effect">
              <CardBody className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="glass-effect">
          <CardBody className="text-center py-12">
            <Icon icon="lucide:briefcase-off" className="text-4xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('lookingForWork.noResults')}</h3>
            <p className="text-gray-400">{t('lookingForWork.tryAdjusting')}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => navigate(`/job/${job.id}`)}
              >
                <Card className="glass-effect h-full hover:bg-white/10 transition-colors">
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          {job.clientPhotoURL ? (
                            <Avatar
                              src={job.clientPhotoURL}
                              className="w-6 h-6"
                              name={formatNameWithInitial(job.clientName || job.company)}
                            />
                          ) : (
                            <Avatar
                              name={formatNameWithInitial(job.clientName || job.company) || t('common.client')}
                              className="w-6 h-6"
                              classNames={{
                                base: "bg-beamly-secondary/20",
                                name: "text-beamly-secondary text-xs"
                              }}
                            />
                          )}
                          <span className="text-sm text-gray-400">
                            {formatNameWithInitial(job.clientName || job.company) || t('common.client')}
                          </span>
                        </div>
                      </div>
                      <Chip
                        size="sm"
                        variant="flat"
                        className="bg-beamly-secondary/20 text-beamly-secondary"
                      >
                        {formatBudget(job)}
                      </Chip>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {job.description}
                    </p>
                    
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills.slice(0, 3).map((skill, idx) => (
                          <Chip
                            key={idx}
                            size="sm"
                            variant="flat"
                            className="bg-white/10"
                          >
                            {skill}
                          </Chip>
                        ))}
                        {job.skills.length > 3 && (
                          <Chip size="sm" variant="flat" className="bg-white/10">
                            +{job.skills.length - 3}
                          </Chip>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <Icon icon="lucide:map-pin" className="w-3 h-3" />
                            {job.location}
                          </span>
                        )}
                        {job.duration && (
                          <span className="flex items-center gap-1">
                            <Icon icon="lucide:clock" className="w-3 h-3" />
                            {job.duration}
                          </span>
                        )}
                      </div>
                      <span>{getTimeAgo(job.createdAt || job.postedAt)}</span>
                    </div>
                    
                    {job.proposalsCount !== undefined && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <span className="text-xs text-gray-400">
                          {job.proposalsCount} {t('lookingForWork.proposals')}
                        </span>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        {canLoadMore && !loading && (
          <div className="flex justify-center mt-8">
            <Button
              color="secondary"
              variant="bordered"
              size="lg"
              onPress={handleLoadMore}
              className="font-medium"
            >
              {t('common.loadMore')}
            </Button>
          </div>
        )}
        </>
      )}
    </div>
  );
};
