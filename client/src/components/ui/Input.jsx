const Input = ({ label, error, type = 'text', ...props }) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
          error
            ? 'border-rose-300 text-rose-900 placeholder-rose-300'
            : 'border-slate-300 text-slate-900 placeholder-slate-400'
        }`}
        {...props}
      />
      {error && (
        <p className="text-sm text-rose-600">{error}</p>
      )}
    </div>
  );
};

export default Input;