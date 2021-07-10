/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideo, faKeyboard } from "@fortawesome/free-solid-svg-icons";
import { v1 as uuid } from "uuid";
import CircularProgress from "@material-ui/core/CircularProgress";
import { createChat, deleteChat } from '../components/Apis';
import logoImg from "../assets/images/logo.png"
import AlertDialog from "../components/AlertDialog";
import axios from "axios";
import "./VideoChatHome.scss";

const VideoChatHome = (props) => {
  const [popup, setPopup] = useState('');
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, loginWithRedirect, isLoading, logout, user } =
    useAuth0();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setPopup("auth");
    }
  }, [isLoading]);

  const handleInputChange = (event) => {
    setLink(event.target.value);
  };

  const startNewMeeting = async () => {
    setLoading(true);
    const roomId = uuid();
    const chatId = await createChat(roomId, user.email);
    if (!chatId){
      setPopup("connection timed out");
      setLoading(false);
    }
    else{
      // chat created successfully
      try {
        const data = {
          room: roomId,
          chat: chatId,
          admin: user.email
        };
        const config = {
          method: "post",
          url: "/new_meeting",
          data: data
        };

        const response = await axios(config);
        if (response.data === "success"){
          setLoading(false);
          props.history.push({
            pathname: `/videochat/room/${roomId}`,
            state: {
              authorised: true, // we are entering the videocall securely through app's interface
              admin: true
            }
          });
        }
        else{
          setPopup("meet creation failed");
          await deleteChat(user.email, chatId);
          setLoading(false);
        }
      }
      catch (error) {
        setPopup("connection timed out");
        await deleteChat(user.email, chatId);
        setLoading(false);
      }
    }
  }

  const handleExistingMeetJoin = async () => {
    setLoading(true);
    const roomId = link;

    // check if the meeting link is valid i.e. contains atleast one user
    try {
      const data = {
        room: roomId,
      }
      const config = {
        method: "post",
        url: "/existing_meeting",
        data: data
      }

      const response = await axios(config);
      if (response.data.status === "failure"){
        setLoading(false);
        setPopup("Meeting link invalid");
      }
      else{
        // join the user in
        setLink("");
        setLoading(false);
        props.history.push({
          pathname: `/videochat/room/${roomId}`,
          state: {
            authorised: true,
            admin: false
          }
        });
      }
    } catch {
      setLoading(false);
      setPopup("connection timed out");
    }
  }

  if (popup === "auth") {
    return (
      <AlertDialog
        title="Unauthorised request!"
        message="You will be redirected to the login page on closing this popup. Please log in to continue."
        showLeft={false}
        showRight={true}
        auto={true}
        time={5000}
        btnTextRight="Ok"
        onClose={() => loginWithRedirect({redirectUri: window.location.origin + "/videochat"})}
        onRight={() => loginWithRedirect({redirectUri: window.location.origin + "/videochat"})}
      />
    )
  }

  if (popup === "connection timed out") {
    return (
      <AlertDialog
        title="ERR Connection Timed Out!"
        message="Please check your internet connection and try again."
        showLeft={false}
        showRight={true}
        auto={false}
        btnTextRight="Ok"
        onClose={() => setPopup('')}
        onRight={() => setPopup('')}
      />
    )
  }

  if (popup === "meet creation failed") {
    return (
      <AlertDialog
        title="Meet creation failed!"
        message="There was a problem in your meeting creation. Please try again."
        showLeft={false}
        showRight={true}
        auto={true}
        time={5000}
        btnTextRight="Ok"
        onClose={() => setPopup('')}
        onRight={() => setPopup('')}
      />
    )
  }

  if (popup === "Meeting link invalid") {
    return (
      <AlertDialog
        title="Meeting code invalid!"
        message="The meeting code you entered is invalid. Please check the code properly and try again."
        showLeft={false}
        showRight={true}
        auto={true}
        time={5000}
        btnTextRight="Ok"
        onClose={() => setPopup('')}
        onRight={() => setPopup('')}
      />
    )
  }

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
              Hi, {"given_name" in user && user.given_name.length > 0 ? user.given_name : ("name" in user && user.name.length > 0 ? user.name : user.email)}!
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
            src={logoImg}
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
