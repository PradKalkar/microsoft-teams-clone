/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideo, faKeyboard } from "@fortawesome/free-solid-svg-icons";
import { v1 as uuid } from "uuid";
import io from "socket.io-client";
import CircularProgress from "@material-ui/core/CircularProgress";
import "./VideoChatHome.scss";


const VideoChatHome = (props) => {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, loginWithRedirect, isLoading, logout, user } =
    useAuth0();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      alert("You cannot visit this page without logging in. Please log in to continue.")
      loginWithRedirect({
        redirectUri: window.location.origin,
      });
    }
  }, [isLoading]);

  const handleInputChange = (event) => {
    setLink(event.target.value);
  };

  const startNewMeeting = () => {
    const roomId = uuid();
    // check if someone is not already present
    const socket = io.connect("/");
    socket.emit("check", roomId);
    setLoading(true);
    socket.on("no", () => {
      setLoading(false);
      console.log("response received", roomId);
      setLink("");
      props.history.push({
        pathname: `/videochat/room/${roomId}`,
        state: {
          authorised: true
        }
      });
    })
  };

  const handleExistingMeetJoin = () => {
    const roomId = link;
    // check if someone is already present
    const socket = io.connect("/");
    socket.emit("check", roomId);
    setLoading(true);
    socket.on("yes", () => {
      setLoading(false);
      console.log("response received", roomId);
      setLink("");
      props.history.push({
        pathname: `/videochat/room/${roomId}`,
        state: {
          authorised: true
        }
      });
    })
    socket.on("no", () => {
      setLoading(false);
      setLink("");
      alert("Meeting code is invalid. Please try again.");
      socket.disconnect();
    })
  };

  return (
      (isLoading || loading || !isAuthenticated) ? (
      <div className="top-level-div">
        <center style={{ marginTop: "5px" }}>
          <CircularProgress color="secondary" />
        </center>
      </div> ) :
      (
        <div className="top-level-div">
      { isAuthenticated &&
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
          }
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
                        placeholder="Enter meeting code"
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
      )
  )
};

export default VideoChatHome;
