const AttendanceLayout = ({ children }) => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-xl shadow-md p-6">
        {children}
      </div>
    </div>
  );
};

export default AttendanceLayout;
