import UploadContract from "../components/UploadContract";

function Dashboard() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Upload a contract to analyze for risky clauses and hidden traps.
        </p>
      </div>

      <UploadContract />

      <div className="mt-10 p-4 bg-blue-50/80 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-900">
          <strong>Coming soon:</strong> Analysis results, risk highlighting, and
          plain English explanations will appear here after processing.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
