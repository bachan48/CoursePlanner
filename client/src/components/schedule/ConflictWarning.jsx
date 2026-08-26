import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

const ConflictWarning = ({ conflicts, onResolve, warnings = [], tips = [] }) => {
  if (!conflicts?.length && !warnings?.length && !tips?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Schedule Conflicts */}
      {conflicts?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-800">
                Schedule Conflicts Detected
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Your schedule has the following conflicts:
              </p>
              <ul className="mt-2 space-y-2">
                {conflicts.map((conflict, index) => (
                  <li
                    key={index}
                    className="flex items-start justify-between gap-2 bg-white rounded p-2 border border-amber-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        {conflict.course1?.name || conflict.course1?.code}
                      </p>
                      <p className="text-xs text-amber-700">
                        {conflict.day} • {conflict.time1} - {conflict.time2}
                      </p>
                    </div>
                    <button
                      onClick={() => onResolve?.(conflict)}
                      className="text-xs font-medium text-amber-600 hover:text-amber-800 whitespace-nowrap"
                    >
                      Resolve
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-yellow-800">
                Schedule Warnings
              </h4>
              <ul className="mt-2 space-y-1">
                {warnings.map((warning, index) => (
                  <li
                    key={index}
                    className="text-sm text-yellow-700 flex items-start gap-2"
                  >
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>{warning.message || warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {tips?.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-800">
                Schedule Tips
              </h4>
              <ul className="mt-2 space-y-1">
                {tips.map((tip, index) => (
                  <li
                    key={index}
                    className="text-sm text-green-700 flex items-start gap-2"
                  >
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConflictWarning;
