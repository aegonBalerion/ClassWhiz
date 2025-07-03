import React from "react";

const UserInfo = ({ user }) => {
  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-[9999]">
      👤 Logged in as <strong>{user.name}</strong> ({user.batch})
    </div>
  );
};

export default UserInfo;
