export default function UserList({ users = [], currentUserId }) {
  return (
    <div className="user-list" aria-label="People in this room">
      <div className="user-avatars">
        {users.slice(0, 4).map((user) => (
          <span className="user-avatar" key={user.id} title={`${user.username}${user.id === currentUserId ? " (you)" : ""}`}>
            {(user.username || "?").slice(0, 1).toUpperCase()}
          </span>
        ))}
        {users.length > 4 && <span className="user-overflow">+{users.length - 4}</span>}
      </div>
      <span className="user-count">{users.length} {users.length === 1 ? "person" : "people"}</span>
    </div>
  );
}