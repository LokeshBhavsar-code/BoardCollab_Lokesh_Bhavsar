import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AuthForm from "./components/AuthForm.jsx";
import CanvasBoard from "./components/CanvasBoard.jsx";
import RoomEntry from "./components/RoomEntry.jsx";
import UserList from "./components/UserList.jsx";
import { useSocket } from "./hooks/useSocket.js";
import { hydrateCanvas } from "./redux/canvasSlice.js";
import { getTokenExpiry } from "./redux/store.js";
import { clearCredentials, setActiveRoom, setCredentials } from "./redux/roomSlice.js";
import { getCachedRoomElements } from "./offline/indexedDb.js";

export default function App() {
  const dispatch = useDispatch();
  const { token, user, activeRoom, users, connected, error } = useSelector((state) => state.room);
  const socket = useSocket(token, activeRoom?._id || activeRoom?.id);

  useEffect(() => {
    if (!token) return undefined;
    const delay = getTokenExpiry(token) - Date.now();
    if (delay <= 0) {
      dispatch(clearCredentials());
      return undefined;
    }
    const timeout = window.setTimeout(() => dispatch(clearCredentials()), delay);
    return () => window.clearTimeout(timeout);
  }, [dispatch, token]);

  async function enterRoom(room) {
    const id = room._id || room.id;
    // Immediately hydrate with server-provided elements (if any)
    dispatch(hydrateCanvas({ roomId: id, elements: room.elements || [] }));
    dispatch(setActiveRoom(room));

    // If no server elements (e.g., offline), fallback to IndexedDB cache
    if (!room.elements || room.elements.length === 0) {
      try {
        const cached = await getCachedRoomElements(id);
        if (cached && cached.length > 0) {
          dispatch(hydrateCanvas({ roomId: id, elements: cached }));
          console.log(`[Offline] Loaded ${cached.length} cached elements for room ${id}`);
        }
      } catch (err) {
        console.warn("[Offline] Could not load cached elements:", err);
      }
    }
  }

  return (
    <div className={activeRoom ? "app-shell board-shell" : "app-shell"}>
      <header className="topbar">
        <button className="brand" type="button" onClick={() => activeRoom && dispatch(setActiveRoom(null))} aria-label="BoardCollab home">
          <span className="brand-mark">B</span><span>BoardCollab</span>
        </button>
        <div className="topbar-right">
          {activeRoom && <UserList users={users} currentUserId={user?.id} />}
          {user && <span className="account-name">{user.username}</span>}
          {user && <button className="quiet-button" type="button" onClick={() => dispatch(clearCredentials())}>Sign out</button>}
        </div>
      </header>
      {!token ? (
        <AuthForm onAuthenticated={(credentials) => dispatch(setCredentials(credentials))} />
      ) : !activeRoom ? (
        <RoomEntry token={token} onEnter={enterRoom} />
      ) : (
        <main className="board-page">
          <div className="board-heading">
            <div>
              <button className="back-button" type="button" onClick={() => dispatch(setActiveRoom(null))}>← All boards</button>
              <h1>{activeRoom.name || "Untitled board"}</h1>
            </div>
            <div className={`connection-status ${connected ? "is-connected" : "is-disconnected"}`} role="status">
              <i />{connected ? "Connected" : "Reconnecting..."}
            </div>
          </div>
          {error && <div className="room-alert" role="alert">{error}</div>}
          <CanvasBoard socket={socket} roomId={activeRoom._id || activeRoom.id} />
          <div className="room-code">ROOM CODE <strong>{activeRoom.code || "------"}</strong></div>
        </main>
      )}
    </div>
  );
}
