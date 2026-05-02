import { useState } from "react";

const AssignWorkerModal = ({ isOpen, onClose, onAssign }) => {
  const [form, setForm] = useState({
    name: "",
    role: "",
    hours: "",
    rate: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.role || !form.hours || !form.rate) {
      alert("All fields are required");
      return;
    }

    const worker = {
      id: Date.now(),
      ...form,
      total: Number(form.hours) * Number(form.rate),
    };

    onAssign(worker);

    setForm({
      name: "",
      role: "",
      hours: "",
      rate: "",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
        <h2 className="text-lg font-bold mb-4">
          Assign Worker
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">

          <input
            name="name"
            placeholder="Worker Name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            name="role"
            placeholder="Role"
            value={form.role}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            name="hours"
            type="number"
            placeholder="Hours"
            value={form.hours}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            name="rate"
            type="number"
            placeholder="Rate per Hour"
            value={form.rate}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <div className="flex justify-end gap-2 pt-2">

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Assign
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default AssignWorkerModal;