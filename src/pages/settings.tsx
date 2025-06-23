import React from "react";
import { ProfileManagementPage } from "../components/profile-management-page";
import { useTheme } from "../contexts/theme-context";
import { useTranslation } from "react-i18next";
import { Card, CardBody, RadioGroup, Radio, Select, SelectItem, Button, Input, Textarea, Avatar } from "@heroui/react";
import { Icon } from "@iconify/react";

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, isDarkMode } = useTheme();
  
  // Add user profile state
  const [user, setUser] = React.useState({
    name: "Emma Phillips",
    email: "emma.phillips@gmail.com",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=emma1",
    title: "UI/UX Designer",
    description: "Experienced UI/UX designer with 5+ years of experience creating user-centered designs for web and mobile applications."
  });
  
  // Add form state for profile editing
  const [editingProfile, setEditingProfile] = React.useState(false);
  const [editingPassword, setEditingPassword] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: user.name,
    title: user.title,
    description: user.description,
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Add file input ref for avatar upload
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const languages = [
    { value: "en", label: t('settings.language.english') },
    { value: "sq", label: t('settings.language.albanian') }
  ];

  const handleLanguageChange = (value: React.Key) => {
    i18n.changeLanguage(value as string);
    localStorage.setItem('lang', value as string);
  };
  
  // Add form change handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Add save profile handler
  const handleSaveProfile = () => {
    setUser(prev => ({
      ...prev,
      name: formData.name,
      title: formData.title,
      description: formData.description
    }));
    setEditingProfile(false);
  };
  
  // Add save password handler
  const handleSavePassword = () => {
    // Here you would typically validate and send to an API
    console.log("Password changed:", formData.newPassword);
    setFormData(prev => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }));
    setEditingPassword(false);
  };
  
  // Add avatar change handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload this file to your server
      // For now, we'll just create a local URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUser(prev => ({
            ...prev,
            avatar: event.target.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        {t('settings.title')}
      </h1>
      
      <div className="grid grid-cols-1 gap-6 max-w-3xl">
        {/* Profile Section - New */}
        <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
          <CardBody className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {t('settings.profile.title')}
              </h2>
              {!editingProfile && (
                <Button 
                  variant="light" 
                  color="primary"
                  startContent={<Icon icon="lucide:edit-2" />}
                  onPress={() => setEditingProfile(true)}
                >
                  {t('settings.profile.edit')}
                </Button>
              )}
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <Avatar 
                  src={user.avatar} 
                  className="w-24 h-24"
                />
                <Button
                  isIconOnly
                  variant="flat"
                  color="primary"
                  size="sm"
                  className="absolute bottom-0 right-0"
                  onPress={() => fileInputRef.current?.click()}
                >
                  <Icon icon="lucide:camera" />
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
              {!editingProfile ? (
                <div className="text-center">
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {user.name}
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {user.title}
                  </p>
                  <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {user.description}
                  </p>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {t('settings.profile.name')}
                    </label>
                    <Input
                      value={formData.name}
                      onValueChange={(value) => handleInputChange('name', value)}
                      className={isDarkMode ? "bg-white/10 border-white/20" : ""}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {t('settings.profile.title')}
                    </label>
                    <Input
                      value={formData.title}
                      onValueChange={(value) => handleInputChange('title', value)}
                      className={isDarkMode ? "bg-white/10 border-white/20" : ""}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {t('settings.profile.description')}
                    </label>
                    <Textarea
                      value={formData.description}
                      onValueChange={(value) => handleInputChange('description', value)}
                      className={isDarkMode ? "bg-white/10 border-white/20" : ""}
                      minRows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="flat"
                      color="default"
                      onPress={() => {
                        setEditingProfile(false);
                        setFormData(prev => ({
                          ...prev,
                          name: user.name,
                          title: user.title,
                          description: user.description
                        }));
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      color="primary"
                      onPress={handleSaveProfile}
                    >
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
        
        {/* Password Section - New */}
        <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
          <CardBody className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {t('settings.password.title')}
              </h2>
              {!editingPassword && (
                <Button 
                  variant="light" 
                  color="primary"
                  startContent={<Icon icon="lucide:lock" />}
                  onPress={() => setEditingPassword(true)}
                >
                  {t('settings.password.change')}
                </Button>
              )}
            </div>
            
            {editingPassword ? (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {t('settings.password.current')}
                  </label>
                  <Input
                    type="password"
                    value={formData.currentPassword}
                    onValueChange={(value) => handleInputChange('currentPassword', value)}
                    className={isDarkMode ? "bg-white/10 border-white/20" : ""}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {t('settings.password.new')}
                  </label>
                  <Input
                    type="password"
                    value={formData.newPassword}
                    onValueChange={(value) => handleInputChange('newPassword', value)}
                    className={isDarkMode ? "bg-white/10 border-white/20" : ""}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {t('settings.password.confirm')}
                  </label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onValueChange={(value) => handleInputChange('confirmPassword', value)}
                    className={isDarkMode ? "bg-white/10 border-white/20" : ""}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="flat"
                    color="default"
                    onPress={() => {
                      setEditingPassword(false);
                      setFormData(prev => ({
                        ...prev,
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: ""
                      }));
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleSavePassword}
                    isDisabled={!formData.currentPassword || !formData.newPassword || formData.newPassword !== formData.confirmPassword}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              </div>
            ) : (
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('settings.password.description')}
              </p>
            )}
          </CardBody>
        </Card>
        
        {/* Appearance Section */}
        <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
          <CardBody className="p-6">
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {t('settings.appearance.title')}
            </h2>
            <RadioGroup
              value={theme}
              onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
              aria-label={t('settings.appearance.theme')}
            >
              <Radio value="light" className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <div className="flex items-center">
                  <Icon icon="lucide:sun" className="mr-2" />
                  {t('settings.appearance.light')}
                </div>
              </Radio>
              <Radio value="dark" className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <div className="flex items-center">
                  <Icon icon="lucide:moon" className="mr-2" />
                  {t('settings.appearance.dark')}
                </div>
              </Radio>
              <Radio value="system" className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <div className="flex items-center">
                  <Icon icon="lucide:monitor" className="mr-2" />
                  {t('settings.appearance.system')}
                </div>
              </Radio>
            </RadioGroup>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {theme === 'system' && t('settings.appearance.systemDescription')}
            </p>
          </CardBody>
        </Card>
        
        {/* Language Section */}
        <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
          <CardBody className="p-6">
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {t('settings.language.title')}
            </h2>
            <div className="max-w-xs">
              <Select
                items={languages}
                selectedKeys={[i18n.language]}
                onSelectionChange={(keys) => handleLanguageChange(Array.from(keys)[0])}
                aria-label={t('settings.language.select')}
                className={isDarkMode ? "glass-effect" : ""}
              >
                {(language) => (
                  <SelectItem key={language.value} value={language.value}>
                    {language.label}
                  </SelectItem>
                )}
              </Select>
            </div>
          </CardBody>
        </Card>
        
        {/* Account Section */}
        <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
          <CardBody className="p-6">
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {t('settings.account.title')}
            </h2>
            
            <div className="mt-4 p-4 border border-red-400/20 rounded-lg bg-red-400/5">
              <h3 className="text-red-400 font-medium">{t('settings.account.dangerZone')}</h3>
              <p className={`mt-2 mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('settings.account.dangerZoneDescription')}
              </p>
              <Button 
                color="danger" 
                variant="flat"
                onPress={() => console.log("Delete account button clicked")}
              >
                {t('settings.account.deleteAccount')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;