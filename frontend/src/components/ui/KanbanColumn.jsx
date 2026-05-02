const KanbanColumn = ({ title, leads, onMove }) => {
  return (
    <div className="bg-gray-100 rounded-xl p-4 w-72">
      <h2 className="font-semibold mb-4">{title}</h2>

      <div className="space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="bg-white p-3 rounded-lg shadow cursor-pointer hover:bg-gray-50"
            onClick={() => onMove(lead)}
          >
            {lead.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanColumn;