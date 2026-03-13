import axios from "axios";

type Props = {
  callId: string;
  callerName: string;
  onAccept: () => void;
  onClose: () => void;
};

export default function IncomingCallModal({
  callId,
  callerName,
  onAccept,
  onClose,
}: Props) {
  const reject = async () => {
    await axios.post(`/api/calls/${callId}/reject`);
    onClose();
  };

  return (
    <div className="incoming-call-modal">

      <h2>📞 Incoming Call</h2>

      <p>{callerName}</p>

      <div style={{ display: "flex", gap: 20 }}>

        <button
          onClick={onAccept}
          style={{ background: "green", color: "#fff" }}
        >
          Accept
        </button>

        <button
          onClick={reject}
          style={{ background: "red", color: "#fff" }}
        >
          Reject
        </button>

      </div>
    </div>
  );
}