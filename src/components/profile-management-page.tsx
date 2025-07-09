import React, { useState, useEffect } from "react";
import { Card, CardBody, Input, Textarea, Button, Avatar, Chip, Switch, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/AuthContext";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "react-hot-toast";
import { PageHeader } from "./page-header";

interface ProfileManagementPageProps {
  // FIXED: Removed unused setCurrentPage
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
      setProfile({
        ...profile,
        skills: [...profile.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter(skill => skill !== skillToRemove)
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <PageHeader
        title="Profile Management"
        subtitle="Manage your professional profile"
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Profile Header Card */}
          <Card className="glass-effect">
            <CardBody>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                <Button
                  color={isEditing ? "secondary" : "primary"}
                  variant={isEditing ? "flat" : "solid"}
                  onPress={() => isEditing ? handleSave() : setIsEditing(true)}
                  isLoading={isSaving}
                >
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex items-center gap-6 mb-4">
                  <Avatar
                    src={user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`}
                    className="w-24 h-24"
                  />
                  {isEditing && (
                    <Button
                      variant="bordered"
                      startContent={<Icon icon="lucide:upload" />}
                    >
                      Change Photo
                    </Button>
                  )}
                </div>

                <Input
                  label="Display Name"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  isReadOnly={!isEditing}
                />

                <Input
                  label="Email"
                  type="email"
                  value={profile.email}
                  isReadOnly
                  isDisabled
                />

                <Input
                  label="Professional Title"
                  placeholder="e.g., Full Stack Developer"
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  isReadOnly={!isEditing}
                />

                <Input
                  label="Hourly Rate"
                  type="number"
                  value={profile.hourlyRate.toString()}
                  onChange={(e) => setProfile({ ...profile, hourlyRate: parseInt(e.target.value) || 0 })}
                  startContent="$"
                  endContent="/hr"
                  isReadOnly={!isEditing}
                />

                <div className="md:col-span-2">
                  <Textarea
                    label="Bio"
                    placeholder="Tell us about yourself..."
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    isReadOnly={!isEditing}
                    minRows={4}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Skills Card */}
          <Card className="glass-effect">
            <CardBody>
              <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.skills.map((skill) => (
                  <Chip
                    key={skill}
                    onClose={isEditing ? () => handleRemoveSkill(skill) : undefined}
                    variant="flat"
                    className="bg-white/10"
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
            </CardBody>
          </Card>

          {/* Availability Card */}
          <Card className="glass-effect">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Availability</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Let clients know you're available for new projects
                  </p>
                </div>
                <Switch
                  isSelected={profile.availability}
                  onValueChange={(value) => setProfile({ ...profile, availability: value })}
                  isDisabled={!isEditing}
                />
              </div>
            </CardBody>
          </Card>

          {/* Social Links Card */}
          <Card className="glass-effect">
            <CardBody>
              <h3 className="text-lg font-semibold text-white mb-4">Social Links</h3>
              
              <div className="space-y-4">
                <Input
                  label="LinkedIn"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={profile.socialLinks.linkedin || ''}
                  onChange={(e) => setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, linkedin: e.target.value }
                  })}
                  startContent={<Icon icon="lucide:linkedin" />}
                  isReadOnly={!isEditing}
                />
                
                <Input
                  label="GitHub"
                  placeholder="https://github.com/yourusername"
                  value={profile.socialLinks.github || ''}
                  onChange={(e) => setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, github: e.target.value }
                  })}
                  startContent={<Icon icon="lucide:github" />}
                  isReadOnly={!isEditing}
                />
                
                <Input
                  label="Personal Website"
                  placeholder="https://yourwebsite.com"
                  value={profile.socialLinks.website || ''}
                  onChange={(e) => setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, website: e.target.value }
                  })}
                  startContent={<Icon icon="lucide:globe" />}
                  isReadOnly={!isEditing}
                />
              </div>
            </CardBody>
          </Card>

          {/* Cancel Button */}
          {isEditing && (
            <div className="flex justify-end gap-4">
              <Button
                variant="light"
                onPress={() => {
                  setIsEditing(false);
                  fetchUserProfile(); // Reset to saved data
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
      </div>
    </div>
  );
};