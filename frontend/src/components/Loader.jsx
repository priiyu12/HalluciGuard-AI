export default function Loader({ message = "Running self-consistency checks & calculating risk scores..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-200 rounded-xl shadow-premium">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
      <p className="mt-4 text-sm font-medium text-slate-600 animate-pulse">{message}</p>
    </div>
  );
}
