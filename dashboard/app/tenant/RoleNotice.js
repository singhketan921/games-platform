export default function RoleNotice({ role, action }) {
  if (!role) return null;
  return (
    <div role="alert" className="alert alert-info text-xs">
      You are signed in as <span className="font-semibold">{role}</span>. {action}
    </div>
  );
}
