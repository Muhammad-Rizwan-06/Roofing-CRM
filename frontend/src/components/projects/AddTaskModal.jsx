import React, { useState } from "react";

const AddTaskModal = ({ setOpen, onAdd }) => {
  const [title, setTitle] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title) return alert("Task required");

    onAdd({
      id: Date.now(),
      title,
      status: "Pending",
    });

    setOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">

      <div className="bg-white p-6 rounded-lg w-80">

        <h2 className="text-lg font-semibold mb-4">
          Add Task
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-gray-400 text-white px-3 py-1 rounded"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Add
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;