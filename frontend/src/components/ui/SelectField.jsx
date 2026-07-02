const SelectField = ({ label, name, value, onChange, options }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600 dark:text-gray-400">{label}</label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2
          bg-white dark:bg-gray-950 text-gray-800 dark:text-white
          outline-none focus:ring-2 focus:ring-blue-500 transition"
      >
        {options.map((opt, index) => {
          if (typeof opt === "string") {
            return (
              <option key={index} value={opt}>
                {opt}
              </option>
            );
          }
          return (
            <option key={index} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default SelectField;
