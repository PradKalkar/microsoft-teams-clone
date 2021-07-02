import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideo, faKeyboard } from "@fortawesome/free-solid-svg-icons";
import "./VideoChatHome.scss";
import { v1 as uuid } from "uuid";
import useWindowDimensions from "../hooks/useWindowDimensions";
import {useState } from 'react';

const VideoChatHome = (props) => {
  const {width} = useWindowDimensions();
  const [link, setLink] = useState('');

  const handleInputChange = event => {
    setLink(event.target.value);
  }

  const startNewMeeting = () => {
    const roomId = uuid();
    props.history.push(`/videochat/room/${roomId}`); // #init signifies admin
  };

  const handleExistingMeetJoin = () => {
    // in link find the characters after the /
    const len = link.length;
    let i = len - 1;
    for (; i >= 0; i--){
      if (link[i] === '/') break;
    }
    i++;
    let roomId = link.substr(i);
    // check last 5 characters of roomId
    // remove them if they are "#init"
    const lastFive = link.substr(i - 5);
    if (lastFive === "#init"){
      roomId = roomId.slice(i, -5);
    }

    if (i !== 0){
      // verify the meet url
      if (link === `https://pradnesh-msteams-clone.azurewebsites.net/videochat/room/${roomId}`){
        // correct 
      }
      else if (link === `pradnesh-msteams-clone.azurewebsites.net/videochat/room/${roomId}`){
        // correct
      }    
      else{
        alert('Invalid Link. Please verify the link or code you entered.')
        return;
      }
      
      // if correct
      setLink('');
      props.history.push(`/videochat/room/${roomId}`);  
    } 
    else{
      // correct
      setLink('');
      props.history.push(`/videochat/room/${roomId}`);  
    }
  }

  return (
    <div className="home-page">
      <img src="/images/pradnesh-msteams-logo-circle.png" alt="logo" style={{height: width / 100 * 20, width: width / 100 * 20, left: width / 100 * 40, position: 'absolute', top: '5vh'}}/>
      <div className="body">
        <div className="left-side">
          <div className="content">
            <div className="action-btn">
              <button className="btn green" onClick={startNewMeeting}>
                <FontAwesomeIcon className="icon-block" icon={faVideo} />
                New Meeting
              </button>
              <div className="input-block">
                <div className="input-section">
                  <FontAwesomeIcon className="icon-block" icon={faKeyboard} />
                  <input placeholder="Enter a code or link" onChange={handleInputChange} />
                </div>
                <button className="btn no-bg" onClick={handleExistingMeetJoin} style={{display: link.length > 0 ? 'block': 'none'}}>Join</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoChatHome;
