import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideo, faKeyboard } from "@fortawesome/free-solid-svg-icons";
import { v1 as uuid } from "uuid";
import CircularProgress from "@material-ui/core/CircularProgress";
import "./VideoChatHome.scss";


const VideoChatHome = (props) => {
  const [link, setLink] = useState("");
  const { isAuthenticated, loginWithRedirect, isLoading, logout, user } =
    useAuth0();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loginWithRedirect({
        redirectUri: window.location.origin,
      });
    }
  }, []);

  const handleInputChange = (event) => {
    setLink(event.target.value);
  };

  const startNewMeeting = () => {
    const roomId = uuid();
    props.history.push(`/videochat/room/${roomId}`); // #init signifies admin
  };

  const handleExistingMeetJoin = () => {
    // in link find the characters after the /
    const len = link.length;
    let i = len - 1;
    for (; i >= 0; i--) {
      if (link[i] === "/") break;
    }
    i++;
    let roomId = link.substr(i);
    // check last 5 characters of roomId
    // remove them if they are "#init"
    const lastFive = link.substr(i - 5);
    if (lastFive === "#init") {
      roomId = roomId.slice(i, -5);
    }

    if (i !== 0) {
      // verify the meet url
      if (
        link ===
        `https://pradnesh-msteams-clone.azurewebsites.net/videochat/room/${roomId}`
      ) {
        // correct
      } else if (
        link ===
        `pradnesh-msteams-clone.azurewebsites.net/videochat/room/${roomId}`
      ) {
        // correct
      } else {
        alert("Invalid Link. Please verify the link or code you entered.");
        return;
      }

      // if correct
      setLink("");
      props.history.push(`/videochat/room/${roomId}`);
    } else {
      // correct
      setLink("");
      props.history.push(`/videochat/room/${roomId}`);
    }
  };

  return (
    <div className="top-level-div">
      {isLoading ? (
        <center style={{ marginTop: "5px" }}>
          <CircularProgress color="secondary" />
        </center>
      ) : (
        <>
          <nav className="homepage-nav-1">
            <h3
              style={{
                fontSize: "auto",
                paddingTop: "10px",
                paddingLeft: "10px",
              }}
            >
              Hi, {"name" in user ? user.name : user.email}!
            </h3>
            <button
              className="btn"
              onClick={() => logout()}
              style={{
                position: "absolute",
                right: "10px",
                width: "100px",
                alignItems: "center",
                marginTop: "2px",
              }}
            >
              Log Out
            </button>
          </nav>
          <nav className="homepage-nav-1">
            <button
              className="btn"
              onClick={() => props.history.push("/")}
              style={{
                position: "absolute",
                right: "10px",
                width: "100px",
                alignItems: "center",
                marginTop: "15px",
              }}
            >
              Home
            </button>
          </nav>
        </>
      )}
      <div className="home-page">
        <center style={{ marginTop: "120px" }}>
          <h2>Konnect Well</h2>
          <img
            src="/images/logo.png"
            alt="logo"
            width="200px"
            height="200px"
          />
          <div className="body">
            <div className="left-side">
              <div className="content">
                <div className="action-btn">
                  <button className="btn" onClick={startNewMeeting}>
                    <FontAwesomeIcon className="icon-block" icon={faVideo} />
                    New Meeting
                  </button>
                  <div className="input-block">
                    <div className="input-section">
                      <FontAwesomeIcon
                        className="icon-block"
                        icon={faKeyboard}
                      />
                      <input
                        placeholder="Enter a code or link"
                        onChange={handleInputChange}
                      />
                    </div>
                    <button
                      className="btn no-bg"
                      onClick={handleExistingMeetJoin}
                      style={{ display: link.length > 0 ? "block" : "none" }}
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </center>
      </div>
    </div>
  );
};

export default VideoChatHome;
