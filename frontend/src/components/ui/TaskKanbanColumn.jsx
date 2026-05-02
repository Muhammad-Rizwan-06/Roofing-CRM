const TaskKanbanColumn = ({ title, tasks, onMove }) => {
  return (
    <div className="bg-gray-100 rounded-xl p-4 w-72">
      <h2 className="font-semibold mb-4">{title}</h2>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white p-3 rounded-lg shadow hover:bg-gray-50 cursor-pointer"
            onClick={() => onMove(task)}
          >
            <p className="font-medium">{task.title}</p>
            <p className="text-sm text-gray-500">
              {task.project}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskKanbanColumn;