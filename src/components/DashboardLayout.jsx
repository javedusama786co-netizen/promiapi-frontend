import Sidebar from "./Sidebar";

function DashboardLayout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar hamesha dikhega dashboard ke andar */}
      <Sidebar />
      {/* Main content area */}
      <div style={{ marginLeft: "270px", width: "100%", padding: "20px" }}>
        {children}
      </div>
    </div>
  );
}
export default DashboardLayout;