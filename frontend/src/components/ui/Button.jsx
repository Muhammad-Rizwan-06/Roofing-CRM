import React from "react";

const Button = ({ children, onClick, type = "button", variant = "primary" }) => {
  const styles =
    variant === "primary"
      ? "bg-blue-500 hover:bg-blue-600 text-white"
      : "bg-gray-200 text-gray-800";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition ${styles}`}
    >
      {children}
    </button>
  );
};

export default Button;