import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Avatar, Button, Input, Textarea, Chip } from "@heroui/react"; // FIXED: Added Chip import
import { Icon } from "@iconify/react";
import { PageHeader } from "../page-header";

interface CommunityPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    badge?: string;
  };
  title: string;
  content: string;
  category: string;
  likes: number;
  comments: number;
  timestamp: string;
  tags: string[];
}

const communityPosts: CommunityPost[] = [
  {
    id: "1",
    author: {
      name: "Sarah Johnson",
      avatar: "https://i.pravatar.cc/150?u=sarah",
      badge: "Top Contributor"
    },
    title: "Tips for Writing Winning Proposals",
    content: "After years of freelancing, I've learned that the key to winning projects isn't just about having the lowest price. Here are my top 5 tips for writing proposals that actually get accepted...",
    category: "Tips & Tricks",
    likes: 234,
    comments: 45,
    timestamp: "2 hours ago",
    tags: ["proposals", "freelancing", "tips"]
  },
  {
    id: "2",
    author: {
      name: "Michael Chen",
      avatar: "https://i.pravatar.cc/150?u=michael",
      badge: "Moderator"
    },
    title: "New Feature Announcement: Real-time Collaboration Tools",
    content: "We're excited to announce the launch of our new real-time collaboration tools! Now you can work with clients more efficiently with built-in video calls, screen sharing, and collaborative whiteboards...",
    category: "Announcements",
    likes: 567,
    comments: 89,
    timestamp: "5 hours ago",
    tags: ["updates", "features", "collaboration"]
  },
  {
    id: "3",
    author: {
      name: "Emily Davis",
      avatar: "https://i.pravatar.cc/150?u=emily"
    },
    title: "How I Scaled My Freelance Business to $100k/year",
    content: "It took me 3 years to go from struggling freelancer to six-figure business owner. Here's my journey and the strategies that made the biggest difference...",
    category: "Success Stories",
    likes: 892,
    comments: 156,
    timestamp: "1 day ago",
    tags: ["success", "business", "growth"]
  }
];

const categories = [
  { name: "All Posts", icon: "lucide:layout-grid", count: 1234 },
  { name: "Announcements", icon: "lucide:megaphone", count: 23 },
  { name: "Tips & Tricks", icon: "lucide:lightbulb", count: 456 },
  { name: "Success Stories", icon: "lucide:trophy", count: 89 },
  { name: "Questions", icon: "lucide:help-circle", count: 234 },
  { name: "Feedback", icon: "lucide:message-square", count: 67 }
];

export const CommunityPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("All Posts");
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "Questions",
    tags: ""
  });

  const handleCreatePost = () => {
    console.log("Creating post:", newPost);
    setShowNewPost(false);
    setNewPost({ title: "", content: "", category: "Questions", tags: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <PageHeader
        title="Community Hub"
        subtitle="Connect, share, and grow with fellow freelancers and clients"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Categories */}
            <Card className="glass-effect mb-6">
              <CardBody>
                <h3 className="text-lg font-semibold mb-4 text-white">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Button
                      key={category.name}
                      variant={selectedCategory === category.name ? "flat" : "light"}
                      className="justify-start w-full"
                      startContent={<Icon icon={category.icon} />}
                      onPress={() => setSelectedCategory(category.name)}
                    >
                      <span className="flex-1 text-left">{category.name}</span>
                      <span className="text-sm text-gray-400">{category.count}</span>
                    </Button>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Top Contributors */}
            <Card className="glass-effect">
              <CardBody>
                <h3 className="text-lg font-semibold mb-4 text-white">Top Contributors</h3>
                <div className="space-y-3">
                  {[
                    { name: "Sarah Johnson", points: 2345, avatar: "sarah" },
                    { name: "Alex Kumar", points: 1987, avatar: "alex" },
                    { name: "Maria Garcia", points: 1654, avatar: "maria" }
                  ].map((contributor, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar
                        src={`https://i.pravatar.cc/150?u=${contributor.avatar}`}
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{contributor.name}</p>
                        <p className="text-xs text-gray-400">{contributor.points} points</p>
                      </div>
                      <div className="text-lg font-bold text-yellow-500">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Create Post Button */}
            <div className="mb-6">
              <Button
                color="secondary"
                size="lg"
                className="w-full"
                startContent={<Icon icon="lucide:plus" />}
                onPress={() => setShowNewPost(true)}
              >
                Create New Post
              </Button>
            </div>

            {/* New Post Form */}
            {showNewPost && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="glass-effect">
                  <CardBody>
                    <h3 className="text-lg font-semibold mb-4 text-white">Create New Post</h3>
                    <div className="space-y-4">
                      <Input
                        label="Title"
                        placeholder="What's your post about?"
                        value={newPost.title}
                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      />
                      <Textarea
                        label="Content"
                        placeholder="Share your thoughts, tips, or questions..."
                        minRows={4}
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      />
                      <div className="flex gap-4">
                        <select
                          className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white"
                          value={newPost.category}
                          onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                        >
                          <option value="Questions">Questions</option>
                          <option value="Tips & Tricks">Tips & Tricks</option>
                          <option value="Success Stories">Success Stories</option>
                          <option value="Feedback">Feedback</option>
                        </select>
                        <Input
                          className="flex-1"
                          placeholder="Tags (comma separated)"
                          value={newPost.tags}
                          onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="light"
                          onPress={() => setShowNewPost(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          color="secondary"
                          onPress={handleCreatePost}
                        >
                          Post
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            )}

            {/* Posts */}
            <div className="space-y-6">
              {communityPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-effect">
                    <CardBody>
                      <div className="flex items-start gap-4">
                        <Avatar
                          src={post.author.avatar}
                          size="lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white">{post.author.name}</h4>
                                {post.author.badge && (
                                  <Chip
                                    size="sm"
                                    color="secondary"
                                    variant="flat"
                                  >
                                    {post.author.badge}
                                  </Chip>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">{post.timestamp}</p>
                            </div>
                            <Chip
                              color="primary"
                              variant="flat"
                              size="sm"
                            >
                              {post.category}
                            </Chip>
                          </div>

                          <h3 className="text-xl font-semibold mb-2 text-white">{post.title}</h3>
                          <p className="text-gray-300 mb-4">{post.content}</p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag) => (
                              <Chip
                                key={tag}
                                size="sm"
                                variant="flat"
                                className="bg-white/10"
                              >
                                #{tag}
                              </Chip>
                            ))}
                          </div>

                          <div className="flex items-center gap-4">
                            <Button
                              variant="light"
                              size="sm"
                              startContent={<Icon icon="lucide:heart" />}
                            >
                              {post.likes}
                            </Button>
                            <Button
                              variant="light"
                              size="sm"
                              startContent={<Icon icon="lucide:message-circle" />}
                            >
                              {post.comments}
                            </Button>
                            <Button
                              variant="light"
                              size="sm"
                              startContent={<Icon icon="lucide:share-2" />}
                            >
                              Share
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-8">
              <Button
                variant="flat"
                endContent={<Icon icon="lucide:arrow-down" />}
              >
                Load More Posts
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};