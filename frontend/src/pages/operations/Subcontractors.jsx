import React, { useEffect, useMemo, useState } from "react";

const lsGet = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const lsSet = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const Subcontractors = () => {
  const [subs, setSubs] = useState(() => lsGet("subcontractors", []));
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    trade: "",
    phone: "",
    email: "",
    rate: "",
    notes: "",
    active: "Yes",
  });

  useEffect(() => {
    lsSet("subcontractors", subs);
  }, [subs]);

  const reset = () => {
    setEditId(null);
    setForm({
      name: "",
      trade: "",
      phone: "",
      email: "",
      rate: "",
      notes: "",
      active: "Yes",
    });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Name is required");

    const payload = {
      name: form.name.trim(),
      trade: form.trade.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      rate: Number(form.rate || 0),
      notes: form.notes || "",
      active: form.active,
      updatedAt: new Date().toISOString(),
    };

    if (editId) {
      setSubs((prev) => prev.map((x) => (x.id === editId ? { ...x, ...payload } : x)));
    } else {
      setSubs((prev) => [
        { id: Date.now(), ...payload, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
    reset();
  };

  const onEdit = (s) => {
    setEditId(s.id);
    setForm({
      name: s.name || "",
      trade: s.trade || "",
      phone: s.phone || "",
      email: s.email || "",
      rate: s.rate ?? "",
      notes: s.notes || "",
      active: s.active || "Yes",
    });
  };

  const onDelete = (id) => {
    const ok = confirm("Delete subcontractor?");
    if (!ok) return;
    setSubs((prev) => prev.filter((x) => x.id !== id));
    if (editId === id) reset();
  };

  const total = useMemo(() => subs.length, [subs]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Subcontractors</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Manage subcontractors (useful for Expenses → Subcontractor category)
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-300">Total</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{total}</p>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow space-y-4 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-white">
            {editId ? "Edit Subcontractor" : "Add Subcontractor"}
          </h2>
          {editId && (
            <button type="button" onClick={reset} className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500">Name *</label>
            <input
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Trade</label>
            <input
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              placeholder="Roofing, Gutters, Painting..."
              value={form.trade}
              onChange={(e) => setForm((p) => ({ ...p, trade: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Rate</label>
            <input
              type="number"
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.rate}
              onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Phone</label>
            <input
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Email</label>
            <input
              type="email"
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Active</label>
            <select
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.active}
              onChange={(e) => setForm((p) => ({ ...p, active: e.target.value }))}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-xs text-gray-500">Notes</label>
            <input
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Optional"
            />
          </div>
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl w-full hover:bg-blue-700">
          {editId ? "Update" : "Add"}
        </button>
      </form>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-x-auto border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">List</div>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-200">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Trade</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{s.name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.trade || "—"}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">${Number(s.rate || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.active}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button className="text-blue-600 hover:underline" onClick={() => onEdit(s)}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => onDelete(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-300">
                  No subcontractors yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Subcontractors;