export default function Dashboard() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      
      <h1 style={{ color: "blue" }}>
        🚀 SaaS Dashboard
      </h1>

      <p>
        Welcome! آپ کا system successfully چل رہا ہے
      </p>

      <hr />

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        
        <div style={{ padding: "20px", border: "1px solid gray" }}>
          📊 Total Users: 10
        </div>

        <div style={{ padding: "20px", border: "1px solid gray" }}>
          💬 Messages Sent: 0
        </div>

        <div style={{ padding: "20px", border: "1px solid gray" }}>
          ⚡ Status: Active
        </div>

      </div>

    </div>
  );
}