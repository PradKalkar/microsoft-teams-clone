import { useState } from "react";
import "./Messenger.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faUserFriends,
  faCommentAlt
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "../utils/helpers"
import DOMPurify from 'dompurify';
import MyToolTip from "../routes/MyToolTip";
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
    sendMsg(msg);
    setMsg("");
  };

  return (
    <div className="messenger-container">
      <div className="messenger-header">
        <h3>Meeting details</h3>
        <FontAwesomeIcon
          className="icon"
          icon={faTimes}
          onClick={() => {
            setIsMessenger(false);
          }}
        />
      </div>

      <div className="messenger-header-tabs">
        <div className="tab">
          <FontAwesomeIcon className="icon" icon={faUserFriends} />
          <p>People (1)</p>
        </div>
        <div className="tab active">
          <FontAwesomeIcon className="icon" icon={faCommentAlt} />
          <p>Chat</p>
        </div>
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

        <MyToolTip title="Send Message">
            <IconButton
              onClick={handleSendMsg}
              className="icon"
            >
              <span class="material-icons-round">send</span>
            </IconButton>
        </MyToolTip>
      </div>
    </div>
  );
};

export default Messenger;