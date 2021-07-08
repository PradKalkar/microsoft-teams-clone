/* eslint-disable react-hooks/exhaustive-deps */
import { ChatEngine} from 'react-chat-engine';
import CircularProgress from "@material-ui/core/CircularProgress";
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const Chat = (props) => {
  const [loading, setLoading] = useState(true);
  const chatRef = useRef();

  useEffect(async () => {
    if (!props.location.state){
      alert("You cannot visit this page directly. You will be redirected to the home page. Please head over to the chat section from the home page.")
      window.location.href = window.location.origin;
    }
    else{
      const config = {
        method: "post",
        url: "/get_secret",
      }
 
      const response = await axios(config);
      chatRef.current = {};
      chatRef.current["projectID"] = response.data.project;
      chatRef.current["userSecret"] = response.data.secret;
      chatRef.current["userName"] = props.location.state.username;
      setTimeout(() => {
        setLoading(false);
        console.log(chatRef.current);
      }, 1000);
    }
  }, [])
  
  return (
    props.location.state && !loading ?  
      (
        <div>
          <ChatEngine
            height="100vh"
            projectID={chatRef.current.projectID}
            userName={chatRef.current.userName}
            userSecret={chatRef.current.userSecret}
          />
        </div>
      ) : 
      (
        <center style={{marginTop: "5px"}}>
            <CircularProgress color="secondary" />
        </center>
      )
    )
};

export default Chat;
