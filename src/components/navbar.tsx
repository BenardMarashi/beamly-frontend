// ... existing imports ...
    
    <Link href="/" className="flex items-center gap-2">
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-beamly-secondary">
        <Icon icon="lucide:message-circle" className="text-xl text-beamly-primary" />
      </div>
      <span className={`text-2xl font-bold font-outfit ${isDarkMode ? "text-white" : "text-gray-900"}`}>
        Beamly
      </span>
    </Link>
    
    // ... rest of component ...