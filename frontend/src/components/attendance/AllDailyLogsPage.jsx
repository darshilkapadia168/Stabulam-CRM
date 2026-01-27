import { useAuth } from "../../context/AuthContext";
import AttendanceLayout from "../../layouts/AttendanceLayout";
import AttendanceTopBar from "./AttendanceTopBar";
import AdminDailyLogs from "./AdminDailyLogs";
import { ShieldAlert } from "lucide-react";

const AllDailyLogsPage = () => {
  const { user } = useAuth();
  const isAuthorized = ['admin', 'super_admin'].includes(user?.role);

  if (!isAuthorized) {
    return (
      <AttendanceLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h2>
              <p className="text-red-600 mb-4">
                Only administrators can view all daily logs.
              </p>
            </div>
          </div>
        </div>
      </AttendanceLayout>
    );
  }

  return (
    <AttendanceLayout>
      <AttendanceTopBar />
      <AdminDailyLogs />
    </AttendanceLayout>
  );
};

export default AllDailyLogsPage;