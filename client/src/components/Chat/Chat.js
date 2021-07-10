/* eslint-disable react-hooks/exhaustive-deps */
import { ChatEngine } from "react-chat-engine";
import CircularProgress from "@material-ui/core/CircularProgress";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import AlertDialog from "../Common/AlertDialog";
import { useAuth0 } from "@auth0/auth0-react";

const Chat = () => {
  const { isLoading, isAuthenticated, loginWithRedirect, user } = useAuth0();
  const [popUp, setPopUp] = useState("");
  const [loading, setLoading] = useState(true);
  const chatRef = useRef();

  useEffect(async () => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setPopUp("auth");
      } else {
        try {
          const config = {
            method: "post",
            url: "/get_secret",
          };

          const response = await axios(config);
          chatRef.current = {};
          chatRef.current["projectID"] = response.data.project;
          chatRef.current["userSecret"] = response.data.secret;
          setTimeout(() => {
            setLoading(false);
          }, 1000);
        } catch {
          setLoading(false);
          setPopUp("connection timed out");
        }
      }
    }
  }, [isLoading]);

  if (popUp === "auth") {
    return (
      <AlertDialog
        title="Unauthorised request!"
        message="You will be redirected to the login page on closing this popup. Please log in to continue."
        showLeft={false}
        showRight={true}
        auto={true}
        time={5000}
        btnTextRight="Ok"
        onClose={() =>
          loginWithRedirect({ redirectUri: window.location.origin + "/chat" })
        }
        onRight={() =>
          loginWithRedirect({ redirectUri: window.location.origin + "/chat" })
        }
      />
    );
  }

  if (popUp === "connection timed out") {
    return (
      <AlertDialog
        title="ERR Connection Timed Out!"
        message="Please check your internet connection and try again."
        showLeft={false}
        showRight={true}
        btnTextRight="OK"
        auto={false}
        onClose={() => {
          setPopUp("");
          window.location.href = window.location.origin + "/chat";
        }}
        onRight={() => {
          setPopUp("");
          window.location.href = window.location.origin + "/chat";
        }}
      />
    );
  }

  return !loading && !isLoading ? (
    <div>
      <ChatEngine
        height="100vh"
        projectID={chatRef.current.projectID}
        userName={user.email}
        userSecret={chatRef.current.userSecret}
      />
    </div>
  ) : (
    <center style={{ marginTop: "5px" }}>
      <CircularProgress color="secondary" />
    </center>
  );
};

export default Chat;
