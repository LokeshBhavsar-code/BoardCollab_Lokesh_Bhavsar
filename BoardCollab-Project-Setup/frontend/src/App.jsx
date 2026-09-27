export default function App() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-mark">B</div>
        <div>
          <h1>BoardCollab</h1>
          <p>Real-time collaborative whiteboard</p>
        </div>
        <span className="status"><i /> Setup ready</span>
      </header>
      <section className="welcome">
        <span className="eyebrow">PROJECT FOUNDATION</span>
        <h2>Your collaborative workspace starts here.</h2>
        <p>The React frontend is running. Canvas tools, authentication, rooms, and live collaboration will be implemented in the upcoming phases.</p>
        <div className="feature-row">
          <span>React + Konva</span><span>Express + Socket.IO</span><span>MongoDB + Redis</span>
        </div>
      </section>
    </main>
  );
}
