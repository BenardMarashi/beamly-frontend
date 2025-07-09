import React, { useState, useEffect } from "react";
import { Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react"; // FIXED: Removed unused Card
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

export const ExplorePage: React.FC<ExplorePageProps> = ({ isDarkMode = true }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("jobs");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
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
      let q = query(collection(db, collectionName));

      // Add filters
      if (selectedCategory !== "all") {
        q = query(q, where("category", "==", selectedCategory));
      }

      if (searchQuery) {
        // In production, you'd want to use a proper full-text search solution
        // For now, we'll just fetch and filter client-side
      }

      // Add sorting
      if (sortBy === "newest") {
        q = query(q, orderBy("createdAt", "desc"));
      }

      q = query(q, limit(20));

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch();
  }, [searchType, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Explore"
        subtitle="Discover amazing opportunities and talented professionals"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <Input
                size="lg"
                placeholder={`Search for ${searchType}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Icon icon="lucide:search" />}
                onKeyPress={(e) => e.key === "Enter" && performSearch()}
              />
            </div>

            <Dropdown>
              <DropdownTrigger>
                <Button variant="flat">
                  {searchType === "jobs" ? "Jobs" : "Freelancers"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Search type"
                onAction={(key) => setSearchType(key as SearchType)}
              >
                <DropdownItem key="jobs">Jobs</DropdownItem>
                <DropdownItem key="freelancers">Freelancers</DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <Dropdown>
              <DropdownTrigger>
                <Button variant="flat">
                  {categories.find(c => c.key === selectedCategory)?.label || "Category"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Categories"
                onAction={(key) => setSelectedCategory(key as string)}
              >
                {categories.map((category) => (
                  <DropdownItem key={category.key}>
                    {category.label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <Dropdown>
              <DropdownTrigger>
                <Button variant="flat">
                  Sort by: {sortBy}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Sort by"
                onAction={(key) => setSortBy(key as SortBy)}
              >
                <DropdownItem key="newest">Newest</DropdownItem>
                <DropdownItem key="relevance">Relevance</DropdownItem>
                <DropdownItem key="price">Price</DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <Button
              color="primary"
              onPress={performSearch}
              isLoading={loading}
            >
              Search
            </Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-500">Searching...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="lucide:search-x" className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                {searchType === "jobs" ? (
                  <JobCard job={item} isDarkMode={isDarkMode} />
                ) : (
                  <FreelancerCard freelancer={item} isDarkMode={isDarkMode} />
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More */}
        {results.length > 0 && results.length % 20 === 0 && (
          <div className="text-center mt-8">
            <Button
              variant="flat"
              onPress={() => {
                // Load more logic
              }}
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};