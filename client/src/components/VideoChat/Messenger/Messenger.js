import { useState } from "react";
import "./Messenger.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "../../../utils/helpers"
import DOMPurify from 'dompurify';
import MyToolTip from "../MyToolTip";
import { IconButton } from "@material-ui/core";

const Messenger = ({ setIsMessenger, sendMsg, messageList }) => {
  const [msg, setMsg] = useState("");

  const handleChangeMsg = (e) => {
    setMsg(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMsg(msg);
      setMsg("");
    }
  };

  const handleSendMsg = () => {
    if (msg.length > 0) sendMsg(msg);
    setMsg("");
  };

  return (
    <div className="messenger-container">
      <div className="messenger-header">
        <h3>Meeting Chat</h3>
        <FontAwesomeIcon
          className="icon"
          icon={faTimes}
          onClick={() => {
            setIsMessenger(false);
          }}
        />
      </div>

      <div className="messenger-header-tabs">
      </div>

      <div className="chat-section">
        {messageList.map((item) => (
          <div key={item.time} className="chat-block">
            <div className="sender">
              {item.user} <small>{formatDate(item.time)}</small>
            </div>
            <p className="msg"
              dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(item.msg),
              }}>
            </p>
          </div>
        ))}
      </div>

      <div className="send-msg-section">
        <input
          placeholder="Send a message to everyone"
          value={msg}
          onChange={(e) => handleChangeMsg(e)}
          onKeyDown={(e) => handleKeyDown(e)}
        />

        <MyToolTip title={msg.length > 0 ? "Send Message" : ""}>
            <IconButton
              disabled={msg.length > 0 ? false : true}
              onClick={handleSendMsg}
              style={{cursor: msg.length > 0 ? "pointer" : "default", fontSize: "20px"}}
            >
              <span class="material-icons-sharp" style={{color: msg.length > 0 ? "#0e7878" : "grey", fontSize: "32px"}}>send</span>
            </IconButton>
        </MyToolTip>
      </div>
    </div>
  );
};

export default Messenger;