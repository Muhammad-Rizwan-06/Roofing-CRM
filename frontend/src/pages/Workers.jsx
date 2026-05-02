import { useState, useEffect } from "react";

// ✅ Safe parser
const getLocalData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const Workers = () => {
  const [workers, setWorkers] = useState(() => getLocalData("workers"));

  const [form, setForm] = useState({
    name: "",
    role: "",
    hours: "",
    rate: "",
  });

  useEffect(() => {
    localStorage.setItem("workers", JSON.stringify(workers));
  }, [workers]);

  const addWorker = (e) => {
    e.preventDefault();

    if (!form.name) return alert("Name required");

    const salary = Number(form.hours) * Number(form.rate);

    const newWorker = {
      id: Date.now(),
      ...form,
      salary,
    };

    setWorkers([...workers, newWorker]);

    setForm({
      name: "",
      role: "",
      hours: "",
      rate: "",
    });
  };

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">Workers</h1>

      {/* FORM */}
      <form
        onSubmit={addWorker}
        className="bg-white p-5 rounded-2xl shadow space-y-4"
      >
        <input
          placeholder="Worker Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          className="border p-3 w-full rounded"
        />

        <input
          placeholder="Role"
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
          className="border p-3 w-full rounded"
        />

        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Hours"
            value={form.hours}
            onChange={(e) =>
              setForm({ ...form, hours: e.target.value })
            }
            className="border p-3 w-full rounded"
          />

          <input
            type="number"
            placeholder="Rate"
            value={form.rate}
            onChange={(e) =>
              setForm({ ...form, rate: e.target.value })
            }
            className="border p-3 w-full rounded"
          />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700">
          Add Worker
        </button>
      </form>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm text-left">

          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Salary</th>
            </tr>
          </thead>

          <tbody>
            {workers.map((w) => (
              <tr
                key={w.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="px-4 py-3">{w.name}</td>
                <td className="px-4 py-3">{w.role}</td>
                <td className="px-4 py-3">{w.hours}</td>
                <td className="px-4 py-3">${w.rate}</td>
                <td className="px-4 py-3 font-semibold">
                  ${w.salary}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
};

export default Workers;