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
  Pagination,
  Skeleton,
  Avatar
} from "@nextui-org/react";
import { Icon } from "@iconify/react";
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

export const LookingForWorkPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBudget, setSelectedBudget] = useState("all");
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [currentPage, setCurrentPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const jobsPerPage = 9;

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "web-development", label: "Web Development" },
    { value: "mobile-development", label: "Mobile Development" },
    { value: "graphic-design", label: "Graphic Design" },
    { value: "writing", label: "Writing & Translation" },
    { value: "digital-marketing", label: "Digital Marketing" },
    { value: "video-animation", label: "Video & Animation" },
    { value: "data-science", label: "Data Science" },
    { value: "business", label: "Business" }
  ];

  const budgetRanges = [
    { value: "all", label: "Any Budget" },
    { value: "0-500", label: "Under $500" },
    { value: "500-1000", label: "$500 - $1,000" },
    { value: "1000-5000", label: "$1,000 - $5,000" },
    { value: "5000+", label: "$5,000+" }
  ];

  const durations = [
    { value: "all", label: "Any Duration" },
    { value: "less-week", label: "Less than a week" },
    { value: "1-4-weeks", label: "1-4 weeks" },
    { value: "1-3-months", label: "1-3 months" },
    { value: "3-6-months", label: "3-6 months" },
    { value: "6+months", label: "6+ months" }
  ];

  const popularSkills = [
    "React", "Node.js", "Python", "UI/UX Design", 
    "WordPress", "SEO", "Content Writing", "Video Editing"
  ];

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPageNum(1);
    lastDocRef.current = null;
  }, [selectedCategory, selectedBudget, selectedDuration, searchQuery]);

  useEffect(() => {
    const shouldReset = currentPage === 1;
    fetchJobs(shouldReset);
  }, [selectedCategory, selectedBudget, selectedDuration, currentPage, searchQuery]);

  const fetchJobs = async (reset = false) => {
    setLoading(true);
    
    // Reset pagination if needed
    if (reset) {
      lastDocRef.current = null;
    }
    
    try {
      const constraints: QueryConstraint[] = [
        where("status", "==", "open"),
        orderBy("createdAt", "desc")
      ];

      // Add category filter
      if (selectedCategory !== "all") {
        constraints.push(where("category", "==", selectedCategory));
      }

      // Add budget filter
      if (selectedBudget !== "all") {
        const [min, max] = selectedBudget.split("-").map(v => v === "5000+" ? 5000 : parseInt(v));
        if (max) {
          constraints.push(where("budgetMax", ">=", min));
          constraints.push(where("budgetMin", "<=", max));
        } else {
          constraints.push(where("budgetMin", ">=", min));
        }
      }

      // Add duration filter
      if (selectedDuration !== "all") {
        constraints.push(where("duration", "==", selectedDuration));
      }

      // Add pagination
      if (!reset && lastDocRef.current) {
        constraints.push(startAfter(lastDocRef.current));
      }

      constraints.push(limit(jobsPerPage));

      const q = query(collection(db, "jobs"), ...constraints);
      const querySnapshot = await getDocs(q);
      
      let jobsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Job));

      // Apply search filter in memory if searchQuery exists
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
      }

      if (reset) {
        setJobs(jobsData);
      } else {
        setJobs(prev => [...prev, ...jobsData]);
      }

      if (querySnapshot.docs.length > 0) {
        lastDocRef.current = querySnapshot.docs[querySnapshot.docs.length - 1];
      }

      // Estimate total pages
      if (querySnapshot.docs.length < jobsPerPage) {
        setTotalPages(currentPage);
      } else {
        setTotalPages(currentPage + 1);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
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
    if (job.budget) return job.budget;
    if (job.budgetRange) return job.budgetRange;
    if (job.fixedPrice) return `$${job.fixedPrice}`;
    if (job.budgetMin && job.budgetMax) return `$${job.budgetMin} - $${job.budgetMax}`;
    if (job.budgetMin) return `$${job.budgetMin}+`;
    return "Negotiable";
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Recently";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return "Just now";
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
      return `${Math.floor(diffInHours / 168)}w ago`;
    } catch (error) {
      return "Recently";
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Find Work"
        subtitle="Discover opportunities that match your skills"
      />

      {/* Search and Filters */}
        <div className="glass-effect p-4 md:p-6 rounded-xl mb-8">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex flex-row gap-2" style={{ flexWrap: 'nowrap' }}>
              <Input
                placeholder="Search for jobs by title, skills, or keywords..."
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
                Search Jobs
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Category"
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
                label="Budget Range"
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
                label="Project Duration"
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
        <h3 className="text-lg font-semibold mb-4">Popular Skills</h3>
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
            <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
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
                              name={job.clientName || job.company}
                            />
                          ) : (
                            <Avatar
                              name={job.clientName || job.company || 'Client'}
                              className="w-6 h-6"
                              classNames={{
                                base: "bg-beamly-secondary/20",
                                name: "text-beamly-secondary text-xs"
                              }}
                            />
                          )}
                          <span className="text-sm text-gray-400">
                            {job.clientName || job.company || 'Client'}
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
                          {job.proposalsCount} proposals
                        </span>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPageNum}
                color="secondary"
                variant="bordered"
                showControls
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};