import { useState } from "react";
import { createRoom, getRoom } from "../api/rooms.js";

export default function RoomEntry({ token, onEnter }) {
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await createRoom(token, { name: roomName.trim(), visibility: "public" });
      onEnter(result.room);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || "Unable to create this room.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await getRoom(token, roomCode.trim());
      onEnter(result.room);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || "Unable to find or join this room.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="room-entry-page">
      <div className="room-entry-head">
        <div><span className="eyebrow">YOUR NEXT SESSION</span><h1>Where to?</h1></div>
        <p>Create a canvas for your team or join one already in motion.</p>
      </div>
      <div className="room-actions">
        <form className="room-action" onSubmit={handleCreate}>
          <span className="action-index">01 / CREATE</span>
          <h2>Start a new board</h2>
          <label>Board name
            <input value={roomName} onChange={(event) => setRoomName(event.target.value)} minLength="2" maxLength="100" placeholder="Sprint planning" required />
          </label>
          <button className="button button-primary" disabled={busy}>{busy ? "Opening..." : "Create board"}<span aria-hidden="true">↗</span></button>
        </form>
        <form className="room-action" onSubmit={handleJoin}>
          <span className="action-index">02 / JOIN</span>
          <h2>Enter a room code</h2>
          <label>Six-character code
            <input value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} maxLength="24" placeholder="A1B2C3" required />
          </label>
          <button className="button button-secondary" disabled={busy}>Join board<span aria-hidden="true">↗</span></button>
        </form>
      </div>
      {error && <p className="form-error room-error" role="alert">{error}</p>}
    </main>
  );
}