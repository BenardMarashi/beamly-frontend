import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Common
      common: {
        welcome: "Welcome",
        loading: "Loading...",
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        submit: "Submit",
        search: "Search",
        filter: "Filter",
        sort: "Sort",
        back: "Back",
        next: "Next",
        previous: "Previous",
        yes: "Yes",
        no: "No",
        confirm: "Confirm",
        error: "Error",
        success: "Success",
        warning: "Warning",
        info: "Info"
      },
      
      // Navigation
      nav: {
        home: "Home",
        dashboard: "Dashboard",
        browseJobs: "Browse Jobs",
        browseFreelancers: "Find Talent",
        messages: "Messages",
        notifications: "Notifications",
        profile: "Profile",
        settings: "Settings",
        logout: "Logout",
        login: "Login",
        signup: "Sign Up"
      },
      
      // Auth
      auth: {
        loginTitle: "Welcome Back",
        signupTitle: "Join Beamly",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm Password",
        forgotPassword: "Forgot Password?",
        rememberMe: "Remember me",
        loginButton: "Login",
        signupButton: "Create Account",
        orContinueWith: "Or continue with",
        alreadyHaveAccount: "Already have an account?",
        dontHaveAccount: "Don't have an account?",
        termsAgreement: "By signing up, you agree to our Terms and Privacy Policy"
      },
      
      // Dashboard
      dashboard: {
        welcome: "Welcome back, {{name}}!",
        overview: "Overview",
        activeProjects: "Active Projects",
        pendingProposals: "Pending Proposals",
        totalEarnings: "Total Earnings",
        newMessages: "New Messages",
        recentActivity: "Recent Activity",
        viewAll: "View All"
      },
      
      // Jobs
      jobs: {
        postJob: "Post a Job",
        jobTitle: "Job Title",
        jobDescription: "Job Description",
        category: "Category",
        skills: "Required Skills",
        budget: "Budget",
        duration: "Duration",
        experienceLevel: "Experience Level",
        proposals: "Proposals",
        viewJob: "View Job",
        applyNow: "Apply Now",
        saveJob: "Save Job",
        reportJob: "Report Job"
      },
      
      // Freelancer
      freelancer: {
        hourlyRate: "Hourly Rate",
        availability: "Availability",
        portfolio: "Portfolio",
        reviews: "Reviews",
        about: "About",
        skills: "Skills",
        experience: "Experience",
        education: "Education",
        certifications: "Certifications",
        languages: "Languages",
        messageMe: "Message Me",
        hireMe: "Hire Me",
        saveProfile: "Save Profile",
        saved: "Saved"
      },
      
      // Messages
      messages: {
        conversations: "Conversations",
        newMessage: "New Message",
        typeMessage: "Type a message...",
        send: "Send",
        delivered: "Delivered",
        read: "Read",
        online: "Online",
        offline: "Offline",
        noMessages: "No messages yet"
      },
      
      // Projects
      projects: {
        postProject: "Post a Project",
        projectTitle: "Project Title",
        projectDescription: "Project Description",
        technologies: "Technologies Used",
        liveUrl: "Live URL",
        githubUrl: "GitHub URL",
        client: "Client",
        duration: "Duration",
        role: "Your Role",
        teamSize: "Team Size",
        challenges: "Challenges",
        solution: "Solution",
        impact: "Impact",
        viewProject: "View Project"
      }
    }
  },
  sq: {
    translation: {
      // Common - Albanian
      common: {
        welcome: "Mirësevini",
        loading: "Duke ngarkuar...",
        save: "Ruaj",
        cancel: "Anulo",
        delete: "Fshi",
        edit: "Ndrysho",
        submit: "Dërgo",
        search: "Kërko",
        filter: "Filtro",
        sort: "Rendit",
        back: "Kthehu",
        next: "Tjetër",
        previous: "I mëparshëm",
        yes: "Po",
        no: "Jo",
        confirm: "Konfirmo",
        error: "Gabim",
        success: "Sukses",
        warning: "Paralajmërim",
        info: "Informacion"
      },
      
      // Navigation - Albanian
      nav: {
        home: "Ballina",
        dashboard: "Paneli",
        browseJobs: "Shfleto Punët",
        browseFreelancers: "Gjej Talent",
        messages: "Mesazhet",
        notifications: "Njoftimet",
        profile: "Profili",
        settings: "Cilësimet",
        logout: "Dil",
        login: "Hyr",
        signup: "Regjistrohu"
      },
      
      // Add more Albanian translations...
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;