import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody } from "@heroui/react";
import { useTheme } from "../contexts/theme-context";

const ContactPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {t('contact.title')}
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('contact.subtitle')}
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Email Card */}
          <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none h-full`}>
            <CardBody className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {t('contact.email.title')}
                  </h3>
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('contact.email.description')}
                  </p>
                  <a 
                    href="mailto:Beamlyapp@gmail.com" 
                    className={`inline-flex items-center gap-2 font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
                  >
                    Beamlyapp@gmail.com
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Location Card */}
          <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none h-full`}>
            <CardBody className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {t('contact.location.title')}
                  </h3>
                  <p className={`mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('contact.location.description')}
                  </p>
                  <address className={`not-italic font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tirana, Albania
                  </address>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Response Time & FAQ Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Response Time */}
          <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
            <CardBody className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {t('contact.responseTime.title')}
                </h3>
              </div>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('contact.responseTime.description')}
              </p>
            </CardBody>
          </Card>

          {/* Business Hours */}
          <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
            <CardBody className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {t('contact.businessHours.title')}
                </h3>
              </div>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('contact.businessHours.description')}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* FAQ Callout */}
        <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none mt-6`}>
          <CardBody className="p-8 text-center">
            <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {t('contact.faq.title')}
            </h3>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('contact.faq.description')}
            </p>
            <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity">
              {t('contact.faq.button')}
            </button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ContactPage;
export { ContactPage };