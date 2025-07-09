import React, { useState, useEffect } from "react";
import { Card, CardBody, Input, Textarea, Button, Avatar, Chip, Switch } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/AuthContext";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "react-hot-toast";
import { PageHeader } from "./page-header";

interface ProfileManagementPageProps {
  isDarkMode?: boolean;
}

interface UserProfile {
  displayName: string;
  email: string;
  title: string;
  bio: string;
  skills: string[];
  hourlyRate: number;
  experienceLevel: string;
  availability: boolean;
  languages: string[];
  portfolio: any[];
  socialLinks: {
    linkedin?: string;
    github?: string;
    website?: string;
  };
}

export const ProfileManagementPage: React.FC<ProfileManagementPageProps> = ({ 
  isDarkMode = true 
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    displayName: '',
    email: '',
    title: '',
    bio: '',
    skills: [],
    hourlyRate: 0,
    experienceLevel: 'intermediate',
    availability: true,
    languages: ['English'],
    portfolio: [],
    socialLinks: {}
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile({
          displayName: data.displayName || user.displayName || '',
          email: data.email || user.email || '',
          title: data.title || '',
          bio: data.bio || '',
          skills: data.skills || [],
          hourlyRate: data.hourlyRate || 0,
          experienceLevel: data.experienceLevel || 'intermediate',
          availability: data.availability !== false,
          languages: data.languages || ['English'],
          portfolio: data.portfolio || [],
          socialLinks: data.socialLinks || {}
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...profile,
        updatedAt: new Date()
      });
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <PageHeader
        title="Profile Management"
        subtitle="Update your professional information"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-effect">
            <CardBody className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Profile Information</h2>
                <Button
                  color={isEditing ? "danger" : "secondary"}
                  variant={isEditing ? "light" : "solid"}
                  onPress={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>

              <div className="space-y-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-center gap-6">
                  <Avatar
                    src={`https://i.pravatar.cc/150?u=${user?.uid}`}
                    className="w-24 h-24"
                  />
                  <div className="flex-1">
                    <Input
                      label="Display Name"
                      value={profile.displayName}
                      onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                      disabled={!isEditing}
                      variant={isEditing ? "bordered" : "flat"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    value={profile.email}
                    disabled
                    variant="flat"
                  />
                  <Input
                    label="Professional Title"
                    placeholder="e.g., Full Stack Developer"
                    value={profile.title}
                    onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
                    disabled={!isEditing}
                    variant={isEditing ? "bordered" : "flat"}
                  />
                </div>

                <Textarea
                  label="Bio"
                  placeholder="Tell us about yourself..."
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  variant={isEditing ? "bordered" : "flat"}
                  minRows={4}
                />

                {/* Skills */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Skills</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.skills.map((skill, index) => (
                      <Chip
                        key={index}
                        onClose={isEditing ? () => handleRemoveSkill(skill) : undefined}
                        variant="flat"
                      >
                        {skill}
                      </Chip>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                        size="sm"
                      />
                      <Button
                        size="sm"
                        color="secondary"
                        onPress={handleAddSkill}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Hourly Rate ($)"
                    value={profile.hourlyRate.toString()}
                    onChange={(e) => setProfile(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                    disabled={!isEditing}
                    variant={isEditing ? "bordered" : "flat"}
                    startContent={<span className="text-gray-400">$</span>}
                  />
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Experience Level</label>
                    <select
                      value={profile.experienceLevel}
                      onChange={(e) => setProfile(prev => ({ ...prev, experienceLevel: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    >
                      <option value="entry">Entry Level</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Available for Work</h3>
                    <p className="text-sm text-gray-400">Let clients know you're available</p>
                  </div>
                  <Switch
                    isSelected={profile.availability}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, availability: value }))}
                    isDisabled={!isEditing}
                    color="secondary"
                  />
                </div>

                {/* Social Links */}
                <div>
                  <h3 className="text-white font-medium mb-4">Social Links</h3>
                  <div className="space-y-3">
                    <Input
                      label="LinkedIn"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={profile.socialLinks.linkedin || ''}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                      }))}
                      disabled={!isEditing}
                      variant={isEditing ? "bordered" : "flat"}
                      startContent={<Icon icon="lucide:linkedin" className="text-gray-400" />}
                    />
                    <Input
                      label="GitHub"
                      placeholder="https://github.com/yourusername"
                      value={profile.socialLinks.github || ''}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, github: e.target.value }
                      }))}
                      disabled={!isEditing}
                      variant={isEditing ? "bordered" : "flat"}
                      startContent={<Icon icon="lucide:github" className="text-gray-400" />}
                    />
                    <Input
                      label="Website"
                      placeholder="https://yourwebsite.com"
                      value={profile.socialLinks.website || ''}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, website: e.target.value }
                      }))}
                      disabled={!isEditing}
                      variant={isEditing ? "bordered" : "flat"}
                      startContent={<Icon icon="lucide:globe" className="text-gray-400" />}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-4 pt-4">
                    <Button
                      variant="light"
                      onPress={() => {
                        setIsEditing(false);
                        fetchUserProfile(); // Reset changes
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      color="secondary"
                      onPress={handleSave}
                      isLoading={isSaving}
                    >
                      Save Changes
                    </Button>
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