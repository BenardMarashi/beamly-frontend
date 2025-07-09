import React, { useState, useEffect } from "react";
import { Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
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
                selectedKeys={new Set([searchType])}
                onSelectionChange={(keys) => setSearchType(Array.from(keys)[0] as SearchType)}
                selectionMode="single"
              >
                <DropdownItem key="jobs">Jobs</DropdownItem>
                <DropdownItem key="freelancers">Freelancers</DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <Dropdown>
              <DropdownTrigger>
                <Button variant="flat">
                  {categories.find(c => c.key === selectedCategory)?.label || "All Categories"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                selectedKeys={new Set([selectedCategory])}
                onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
                selectionMode="single"
              >
                {categories.map(category => (
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
                selectedKeys={new Set([sortBy])}
                onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as SortBy)}
                selectionMode="single"
              >
                <DropdownItem key="newest">Newest</DropdownItem>
                <DropdownItem key="relevance">Relevance</DropdownItem>
                <DropdownItem key="price">Price</DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <Button color="secondary" onPress={performSearch}>
              Search
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {searchType === "jobs" ? (
                  <JobCard job={result} />
                ) : (
                  <FreelancerCard freelancer={result} />
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No results found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};