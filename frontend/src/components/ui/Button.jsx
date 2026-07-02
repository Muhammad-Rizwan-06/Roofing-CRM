const Button = ({ children, onClick, type = "button", variant = "primary" }) => {
  const styles =
    variant === "primary"
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600";

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
