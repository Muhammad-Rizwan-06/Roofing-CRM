const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly = false,
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600 dark:text-gray-400">{label}</label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 
          bg-white dark:bg-gray-950 text-gray-800 dark:text-white 
          placeholder-gray-400 dark:placeholder-gray-500
          outline-none focus:ring-2 focus:ring-blue-500 transition
          ${readOnly ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-70" : ""}`}
      />
    </div>
  );
};

export default InputField;
