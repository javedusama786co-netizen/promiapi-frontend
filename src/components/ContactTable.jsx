import { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx"; 

function ContactTable({ initialGroupFilter }) {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState(initialGroupFilter || "All");
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  // Hardcoded Fallback URL context sync ensure karne ke liye
  const API_BASE_URL = "http://api.promiapi.com"; // default fallback

  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoading(true);
    
    Promise.all([
      axios.get(`${API_BASE_URL}/api/groups`, { 
        headers: { Authorization: `Bearer ${token}` } 
      }).catch(() => ({ data: { groups: [] } })), // Optional safety catch for groups
      axios.get(`${API_BASE_URL}/api/contacts`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    ])
      .then(([groupsRes, contactsRes]) => {
        setGroups(groupsRes.data.groups?.map(g => g.name) || []);
        setContacts(contactsRes.data.contacts || []);
      })
      .catch((err) => console.error("Data tracking failure:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, groupFilter]);

  // Client-side mapping algorithms
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery);
    const matchesGroup = groupFilter === "All" || c.group === groupFilter;
    return matchesSearch && matchesGroup;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContacts = filteredContacts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);

  const handleExportExcel = () => {
    if (filteredContacts.length === 0) return alert("No active data elements found to export.");
    
    const dataMatrix = filteredContacts.map(c => ({
      "Contact Name": c.name,
      "WhatsApp Number": `+${c.phone}`,
      "Group Segment": c.group,
      "Status": c.status || "ACTIVE"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataMatrix);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Workspace Export");
    XLSX.writeFile(workbook, "Contacts_Dataset.xlsx");
  };

  if (loading) return <div style={{ padding: "20px", color: "#64748b" }}>Loading internal database layout variables...</div>;

  return (
    <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "12px", width: "70%", flexWrap: "wrap" }}>
          <input 
            type="text" 
            placeholder="🔍 Query user records..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={tableStyles.input} 
          />
          <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} style={tableStyles.select}>
            <option value="All">All Groups (Show Everything)</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <button onClick={handleExportExcel} style={tableStyles.exportBtn}>📥 Export Sheets</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={tableStyles.th}>Name</th>
              <th style={tableStyles.th}>Targeting Identity</th>
              <th style={tableStyles.th}>Group Parameter</th>
              <th style={tableStyles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentContacts.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                  No contacts rendered. Database sync active but filters returned empty grid stack.
                </td>
              </tr>
            ) : (
              currentContacts.map(c => (
                <tr key={c._id || c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={tableStyles.tdBold}>👤 {c.name}</td>
                  <td style={tableStyles.tdMono}>+{c.phone}</td>
                  <td style={tableStyles.td}><span style={tableStyles.badge}>{c.group}</span></td>
                  <td style={{ ...tableStyles.td, color: "#16a34a", fontWeight: "700" }}>{c.status || "ACTIVE"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={tableStyles.paginationContainer}>
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            style={{ ...tableStyles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
          >
            ◀ Previous
          </button>
          <span style={tableStyles.pageInfo}>
            Page <strong>{currentPage}</strong> of {totalPages} ({filteredContacts.length} total)
          </span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            style={{ ...tableStyles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  );
}

const tableStyles = {
  input: { padding: "10px", width: "240px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" },
  select: { padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", outline: "none", cursor: "pointer" },
  exportBtn: { background: "#10b981", color: "#fff", padding: "10px 16px", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" },
  th: { padding: "12px", textTransform: "uppercase", fontSize: "11px", color: "#64748b", textAlign: "left" },
  td: { padding: "12px", color: "#334155", fontSize: "14px" },
  tdBold: { padding: "12px", color: "#0f172a", fontWeight: "600", fontSize: "14px" },
  tdMono: { padding: "12px", fontFamily: "monospace", color: "#475569" },
  badge: { background: "#eff6ff", color: "#1e40af", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" },
  paginationContainer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" },
  pageBtn: { background: "#0f172a", color: "#fff", padding: "8px 14px", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600", transition: "background 0.2s" },
  pageInfo: { fontSize: "13px", color: "#475569" }
};

export default ContactTable;