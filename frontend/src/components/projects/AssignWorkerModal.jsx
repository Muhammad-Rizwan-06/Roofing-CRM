import { useState } from "react";
import { createPortal } from "react-dom";

const inputClass =
  "w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

const AssignWorkerModal = ({ isOpen, onClose, onAssign }) => {
  const [form, setForm] = useState({ name: "", role: "", hours: "", rate: "" });

  if (!isOpen) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.role || !form.hours || !form.rate) {
      alert("All fields are required");
      return;
    }
    onAssign({ id: Date.now(), ...form, total: Number(form.hours) * Number(form.rate) });
    setForm({ name: "", role: "", hours: "", rate: "" });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-96 shadow-xl">
        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
          Assign Worker
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            placeholder="Worker Name"
            value={form.name}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            name="role"
            placeholder="Role"
            value={form.role}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            name="hours"
            type="number"
            placeholder="Hours"
            value={form.hours}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            name="rate"
            type="number"
            placeholder="Rate per Hour"
            value={form.rate}
            onChange={handleChange}
            className={inputClass}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AssignWorkerModal;
