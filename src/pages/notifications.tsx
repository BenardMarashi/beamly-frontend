import React from "react";

export const NotificationsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Notifications</h1>
      <div className="glass-effect p-6">
        <p className="text-white">You have no new notifications.</p>
      </div>
    </div>
  );
};

export default NotificationsPage;