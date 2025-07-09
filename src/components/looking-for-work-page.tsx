import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Input, 
  Button, 
  Card, 
  CardBody, 
  Chip, 
  Select, 
  SelectItem,
  Pagination,
  Skeleton
} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { collection, query, where, orderBy, limit, getDocs, startAfter, DocumentSnapshot, QueryConstraint } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "./page-header";
import { JobCard } from "./job-card";

interface LookingForWorkPageProps {
  setCurrentPage?: (page: string) => void;
  isDarkMode?: boolean;
}

interface Job {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  budgetType: 'fixed' | 'hourly';
  category: string;
  skills: string[];
  clientName: string;
  clientPhotoURL?: string;
  createdAt: any;
  proposalCount: number;
  location?: string;
  duration?: string;
  experienceLevel?: string;
}

export const LookingForWorkPage: React.FC<LookingForWorkPageProps> = ({ 
  setCurrentPage: _setCurrentPage,
  isDarkMode: _isDarkMode = true 
}) => {
  // Note: setCurrentPage and isDarkMode are passed from parent but we're using React Router navigation
  // These props are kept for backward compatibility but not used internally
  
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBudget, setSelectedBudget] = useState("all");
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
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

  useEffect(() => {
    fetchJobs();
  }, [selectedCategory, selectedBudget, selectedDuration, currentPage]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let constraints: QueryConstraint[] = [
        where("status", "==", "open"),
        orderBy("createdAt", "desc"),
        limit(jobsPerPage)
      ];

      // Add category filter
      if (selectedCategory !== "all") {
        constraints = [where("category", "==", selectedCategory), ...constraints];
      }

      // Add budget filter
      if (selectedBudget !== "all") {
        const [min, max] = selectedBudget.split("-").map(v => v === "5000+" ? 5000 : parseInt(v));
        if (max) {
          constraints.push(where("budgetMin", ">=", min));
          constraints.push(where("budgetMax", "<=", max));
        } else {
          constraints.push(where("budgetMin", ">=", min));
        }
      }

      // Handle pagination
      if (currentPage > 1 && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(collection(db, "jobs"), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const jobsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Job));

      setJobs(jobsData);
      
      // Set last document for pagination
      if (querySnapshot.docs.length > 0) {
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }

      // Estimate total pages (simplified)
      if (querySnapshot.docs.length < jobsPerPage) {
        setTotalPages(currentPage);
      } else {
        setTotalPages(currentPage + 1);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    fetchJobs();
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Find Work"
        subtitle="Discover opportunities that match your skills"
      />

      {/* Search and Filters */}
      <Card className="glass-effect mb-8">
        <CardBody className="p-6">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Input
                placeholder="Search for jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  trigger: "bg-white/5"
                }}
              >
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Budget Range"
                selectedKeys={[selectedBudget]}
                onChange={(e) => setSelectedBudget(e.target.value)}
                classNames={{
                  trigger: "bg-white/5"
                }}
              >
                {budgetRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Project Duration"
                selectedKeys={[selectedDuration]}
                onChange={(e) => setSelectedDuration(e.target.value)}
                classNames={{
                  trigger: "bg-white/5"
                }}
              >
                {durations.map((dur) => (
                  <SelectItem key={dur.value} value={dur.value}>
                    {dur.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </form>

          {/* Popular Skills */}
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Popular skills:</p>
            <div className="flex flex-wrap gap-2">
              {popularSkills.map((skill) => (
                <Chip
                  key={skill}
                  variant="bordered"
                  className="cursor-pointer hover:bg-white/10"
                  onClick={() => setSearchQuery(skill)}
                >
                  {skill}
                </Chip>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Results Summary */}
      {!loading && (
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-400">
            Found {jobs.length} jobs matching your criteria
          </p>
          {user && (
            <Button
              variant="flat"
              color="primary"
              startContent={<Icon icon="lucide:bell" />}
            >
              Create Job Alert
            </Button>
          )}
        </div>
      )}

      {/* Job Listings */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-effect">
              <CardBody className="p-6">
                <Skeleton className="rounded-lg mb-4">
                  <div className="h-6 w-3/4 rounded-lg bg-default-300"></div>
                </Skeleton>
                <Skeleton className="rounded-lg mb-2">
                  <div className="h-4 w-full rounded-lg bg-default-300"></div>
                </Skeleton>
                <Skeleton className="rounded-lg">
                  <div className="h-4 w-5/6 rounded-lg bg-default-300"></div>
                </Skeleton>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </motion.div>

          {jobs.length === 0 && (
            <Card className="glass-effect">
              <CardBody className="text-center py-16">
                <Icon icon="lucide:briefcase" className="text-6xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
                <p className="text-gray-400 mb-4">Try adjusting your filters to see more results</p>
                <Button
                  color="primary"
                  variant="flat"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedBudget("all");
                    setSelectedDuration("all");
                  }}
                >
                  Clear Filters
                </Button>
              </CardBody>
            </Card>
          )}

          {/* Pagination */}
          {jobs.length > 0 && totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPageNum}
                color="secondary"
                variant="flat"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};