import { PiCheckCircle, PiWarningCircle, PiX } from "react-icons/pi";

function StatusMessage({ message, onDismiss }) {
  if (!message) return null;

  const isError = message.type === "error";

  return (
    <div
      className={`status-message status-message--${message.type}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <span className="status-message__mark" aria-hidden="true">
        {isError ? <PiWarningCircle /> : <PiCheckCircle />}
      </span>
      <p>{message.text}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss message">
        <PiX aria-hidden="true" />
      </button>
    </div>
  );
}

export default StatusMessage;
