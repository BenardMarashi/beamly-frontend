import React from "react";
import { Card, CardBody, Input, Button, Textarea } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

const ContactUsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log("Form submitted:", formData);
    // Reset form after submission
    setFormData({ name: "", email: "", subject: "", message: "" });
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className={`text-3xl font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        {t('footer.contact')}
      </h1>
      
      <p className={`text-center mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Have questions or need assistance? We're here to help!
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Contact Form */}
        <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
          <CardBody className="p-6">
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Send us a message
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Your Name"
                placeholder="Enter your full name"
                value={formData.name}
                onValueChange={value => handleChange("name", value)}
                className={isDarkMode ? "bg-white/10" : ""}
              />
              
              <Input
                label="Email Address"
                placeholder="Enter your email address"
                type="email"
                value={formData.email}
                onValueChange={value => handleChange("email", value)}
                className={isDarkMode ? "bg-white/10" : ""}
              />
              
              <Input
                label="Subject"
                placeholder="What is your message about?"
                value={formData.subject}
                onValueChange={value => handleChange("subject", value)}
                className={isDarkMode ? "bg-white/10" : ""}
              />
              
              <Textarea
                label="Message"
                placeholder="Type your message here..."
                value={formData.message}
                onValueChange={value => handleChange("message", value)}
                className={isDarkMode ? "bg-white/10" : ""}
                minRows={5}
              />
              
              <Button 
                type="submit" 
                color="secondary"
                className="w-full font-medium"
              >
                Send Message
              </Button>
            </form>
          </CardBody>
        </Card>
        
        {/* Contact Information */}
        <div className="space-y-6">
          <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
            <CardBody className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-beamly-secondary/20 mr-3">
                  <Icon icon="lucide:mail" className="text-beamly-secondary" />
                </div>
                <div>
                  <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Email Us
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    support@beamlyapp.com
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
            <CardBody className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-beamly-secondary/20 mr-3">
                  <Icon icon="lucide:map-pin" className="text-beamly-secondary" />
                </div>
                <div>
                  <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Office Location
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Tirana, Albania
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
            <CardBody className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-beamly-secondary/20 mr-3">
                  <Icon icon="lucide:clock" className="text-beamly-secondary" />
                </div>
                <div>
                  <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Business Hours
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Monday - Friday: 9:00 AM - 5:00 PM CET
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
            <CardBody className="p-6">
              <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Connect With Us
              </h3>
              <div className="flex gap-3">
                {["lucide:facebook", "lucide:twitter", "lucide:instagram", "lucide:linkedin"].map((icon, index) => (
                  <Button
                    key={index}
                    isIconOnly
                    variant="flat"
                    className="bg-beamly-secondary/10"
                  >
                    <Icon icon={icon} className="text-beamly-secondary" />
                  </Button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
export { ContactUsPage };