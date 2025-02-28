import { Loader2 } from "lucide-react";

const Loading = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="text-center">
      <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
      <p className="mt-4 text-lg font-medium text-gray-700">
        Loading Conciliator
      </p>
    </div>
  </div>
);

export default Loading;
