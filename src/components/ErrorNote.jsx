export default function ErrorNote({ message }) {
  if (!message) return null
  return <p className="error-note">{message}</p>
}
