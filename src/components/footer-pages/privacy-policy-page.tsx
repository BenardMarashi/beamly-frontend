import React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "../page-header";
import { useTheme } from "../../contexts/theme-context";

export const PrivacyPolicyPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Privacy Policy"
        subtitle="Effective Date: 06.10.2025"
        showBackButton
      />
      
      <div className="glass-effect p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}
        >
          <p className={isDarkMode ? "text-white" : "text-gray-600"}>
            At Beamly, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and protect your personal information in accordance with applicable laws, including the General Data Protection Regulation (GDPR).
          </p>
          
          <p className={isDarkMode ? "text-white" : "text-gray-600"}>
            By using our platform, you agree to the collection and use of information in accordance with this Privacy Policy.
          </p>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>1. Information We Collect</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-2`}>We collect the following types of personal information:</p>
          <ul className={`list-disc pl-6 ${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            <li>
              <strong className={isDarkMode ? "text-white" : "text-gray-900"}>Account Information:</strong> When you create an account on Beamly, we collect your name, email address, username, and other contact information you provide.
            </li>
            <li>
              <strong className={isDarkMode ? "text-white" : "text-gray-900"}>Profile Information:</strong> Information you add to your profile, such as your photo, skills, experience, education, and portfolio.
            </li>
            <li>
              <strong className={isDarkMode ? "text-white" : "text-gray-900"}>Payment Information:</strong> When you make or receive payments, we collect payment details, transaction history, and billing information.
            </li>
            <li>
              <strong className={isDarkMode ? "text-white" : "text-gray-900"}>Communications:</strong> Content of messages, proposals, and other communications on our platform.
            </li>
            <li>
              <strong className={isDarkMode ? "text-white" : "text-gray-900"}>Usage Data:</strong> Information about how you use our platform, including log data, device information, and cookies.
            </li>
          </ul>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>2. How We Use Your Information</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-2`}>We use your personal information for the following purposes:</p>
          <ul className={`list-disc pl-6 ${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            <li>To provide and maintain our services</li>
            <li>To process transactions and manage payments</li>
            <li>To match freelancers with clients</li>
            <li>To communicate with you about our services</li>
            <li>To improve and personalize your experience</li>
            <li>To provide customer support</li>
            <li>To ensure platform security and prevent fraud</li>
            <li>To comply with legal obligations</li>
          </ul>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>3. Information Sharing and Disclosure</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-2`}>We may share your information with:</p>
          <ul className={`list-disc pl-6 ${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            <li>Other users as necessary for providing our services</li>
            <li>Service providers who help us operate our platform</li>
            <li>Payment processors to facilitate transactions</li>
            <li>Legal authorities when required by law</li>
            <li>Third parties in connection with a merger, acquisition, or sale of assets</li>
          </ul>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>4. Your Rights and Choices</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-2`}>You have the following rights regarding your personal information:</p>
          <ul className={`list-disc pl-6 ${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            <li>Access and receive a copy of your data</li>
            <li>Rectify or update your information</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict processing of your data</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>5. Data Security</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>6. International Data Transfers</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information when transferred internationally.
          </p>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>7. Changes to This Privacy Policy</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top.
          </p>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>8. Contact Us</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            If you have any questions about this Privacy Policy, please contact us at privacy@beamly.com.
          </p>
        </motion.div>
      </div>
    </div>
  );
};