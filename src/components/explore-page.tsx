import React, { useState, useEffect } from "react";
import { Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { JobCard } from "./job-card";
import { FreelancerCard } from "./freelancer-card";
import { PageHeader } from "./page-header";

interface ExplorePageProps {
  isDarkMode?: boolean;
}

type SearchType = "jobs" | "freelancers";
type SortBy = "newest" | "relevance" | "price";

export const ExplorePage: React.FC<ExplorePageProps> = ({ isDarkMode: _isDarkMode = true }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("jobs");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    { key: "all", label: "All Categories" },
    { key: "web-development", label: "Web Development" },
    { key: "graphic-design", label: "Graphic Design" },
    { key: "writing", label: "Writing & Translation" },
    { key: "digital-marketing", label: "Digital Marketing" },
    { key: "video-animation", label: "Video & Animation" },
    { key: "music-audio", label: "Music & Audio" },
    { key: "programming", label: "Programming & Tech" },
    { key: "business", label: "Business" },
  ];

  const performSearch = async () => {
    setLoading(true);
    try {
      const collectionName = searchType === "jobs" ? "jobs" : "users";
      let q;

      if (searchType === "jobs") {
        const constraints = [
          where("status", "==", "open"),
          orderBy("createdAt", "desc"),
          limit(20)
        ];
        
        if (selectedCategory !== "all") {
          constraints.unshift(where("category", "==", selectedCategory));
        }
        
        q = query(collection(db, collectionName), ...constraints);
      } else {
        q = query(
          collection(db, collectionName),
          where("userType", "in", ["freelancer", "both"]),
          orderBy("rating", "desc"),
          limit(20)
        );
      }

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setResults(data);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch();
  }, [searchType, selectedCategory, sortBy]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Explore"
        subtitle="Discover talented freelancers and exciting projects"
      />

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <Input
            placeholder={`Search for ${searchType === "jobs" ? "jobs" : "freelancers"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<Icon icon="lucide:search" />}
            size="lg"
            classNames={{
              inputWrapper: "bg-white/10 border-white/20"
            }}
          />
        </div>

        <div className="flex gap-2">
          <Dropdown>
            <DropdownTrigger>
              <Button variant="bordered" className="capitalize">
                {searchType}
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Search type"
              selectedKeys={[searchType]}
              onSelectionChange={(keys) => setSearchType(Array.from(keys)[0] as SearchType)}
            >
              <DropdownItem key="jobs">Jobs</DropdownItem>
              <DropdownItem key="freelancers">Freelancers</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger>
              <Button variant="bordered" className="capitalize">
                {categories.find(c => c.key === selectedCategory)?.label || "All Categories"}
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Category"
              selectedKeys={[selectedCategory]}
              onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
            >
              {categories.map((category) => (
                <DropdownItem key={category.key}>{category.label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger>
              <Button variant="bordered" className="capitalize">
                Sort: {sortBy}
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Sort by"
              selectedKeys={[sortBy]}
              onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as SortBy)}
            >
              <DropdownItem key="newest">Newest</DropdownItem>
              <DropdownItem key="relevance">Relevance</DropdownItem>
              <DropdownItem key="price">Price</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Searching...</p>
          </div>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {results.map((item) => (
            searchType === "jobs" ? (
              <JobCard key={item.id} job={item} />
            ) : (
              <FreelancerCard key={item.id} freelancer={item} />
            )
          ))}
        </motion.div>
      )}

      {results.length === 0 && !loading && (
        <div className="text-center py-12">
          <Icon icon="lucide:search-x" className="text-6xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
          <p className="text-gray-400">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
};