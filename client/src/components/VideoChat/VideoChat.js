/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, useReducer } from "react";
import io from "socket.io-client";
import CircularProgress from "@material-ui/core/CircularProgress";
import Peer from "simple-peer";
import {
  GridList,
  GridListTile,
  GridListTileBar,
  IconButton,
} from "@material-ui/core";
import MyToolTip from "./MyToolTip";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import PartnerVideo from "./PartnerVideo";
import { useAuth0 } from "@auth0/auth0-react";
import AlertDialog from "../Common/AlertDialog";
import { addUser, getChatMsgs, sendChatMsg } from '../Chat/Apis';
import Messenger from "../VideoChat/Messenger/Messenger";
import MessageListReducer from "../../reducers/MessageListReducer";

const initialState = [];

const Room = (props) => {
  const hangUpAudio = new Audio("/sounds/hangupsound.mp3");
  const joinInAudio = new Audio("/sounds/joinsound.mp3");
  const permitAudio = new Audio("/sounds/permission.mp3");
  const waitingAudio = new Audio("/sounds/waiting.mp3");
  const errorAudio = new Audio("/sounds/error.mp3");
  const chatNotificationAudio = new Audio("/sounds/chat.mp3");

  const [messageList, messageListReducer] = useReducer(
    MessageListReducer,
    initialState
  );
  const [isMessenger, setIsMessenger] = useState(false);
  const [messageAlert, setMessageAlert] = useState(false);  
  
  const { isAuthenticated, loginWithRedirect, isLoading, user } = useAuth0();
  const [loading, setLoading] = useState(false);
  const [popUp, setPopUp] = useState('');
  const { width } = useWindowDimensions(); // dynamic width of webpage 
  const [peers, setPeers] = useState([]);
  const [videoMuted, setVideoMuted] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [screenShared, setScreenShared] = useState(false);

  const joiningSocket = useRef();
  const socketRef = useRef();
  const userVideo = useRef();
  const userStream = useRef();
  const audioTrack = useRef();
  const videoTrack = useRef();
  const tmpTrack = useRef();
  const screenTrack = useRef();
  const peersRef = useRef([]); // array of peer objects
  const roomID = props.match.params.roomID;

  // when a user presses the back button, disconnect the socket
  window.onpopstate = () => {
    if (userStream.current)
      userStream.current.getTracks().forEach((track) => track.stop());
      socketRef.current.disconnect();
      window.location.reload();
  };

  const joinPersonIn = () => {
    joinInAudio.play();
    setTimeout(() => {
      navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((myStream) => {
        setLoading(false);
        userStream.current = myStream;
        videoTrack.current = userStream.current.getTracks()[1];
        audioTrack.current = userStream.current.getTracks()[0];
        userVideo.current.srcObject = myStream;
        const userAlias = ("given_name" in user && user.given_name.length > 0 ?
                                  `${user.given_name} ${user.family_name}` : 
                                  user.email);

        socketRef.current.emit("join room", {room: roomID, userIdentity: userAlias, email: user.email});

        socketRef.current.on("permit?", payload => {
          permitAudio.play();
          const userAlias = payload.userAlias;
          const socketid = payload.id;
          joiningSocket.current = socketid;
          setPopUp(`1 ${userAlias}`);
          // identify popup using popup[0] = 1
        })

        // this is received by the user who just joined
        // we get all the users present in the room
        socketRef.current.on("all other users", (partners) => {
          // create a peer for us corresponding to connection to every other user in the room
          partners.forEach((partnerId) => {
            const peer = createPeer(partnerId, myStream, userAlias);
            peersRef.current.push({
              peerID: partnerId, // this particular peer is representing conection b/w me and partnerId
              userIdentity: "Loading...",
              peer,
            });
          });
          setPeers([...peersRef.current]); // update the state to render their streams
        });

        // this event is received by a user who is already present within the room
        // so we need to add peer corresponding to the new comer
        // we are also receiving peer signal(offer) from new comer
        socketRef.current.on("user joined", (payload) => {
          joinInAudio.play();
          const peer = addPeer(payload.signal, payload.callerID, payload.userIdentity, myStream, userAlias);
          peersRef.current.push({
            peerID: payload.callerID,
            userIdentity: payload.userIdentity,
            peer, // this is equivalent to peer: peer
          });

          // add new peerobj to peers state
          setPeers([...peersRef.current]);
          setTimeout(() => {
            setPopUp(`3 ${payload.userIdentity}`);
          }, 1000);
          
        });

        // now the peer who has joined just now is receiving the retrned signal
        // from the peers to whom it had sent signal to
        socketRef.current.on("answer", (payload) => {
          // finding the corresponding peer which is item.peer
          peersRef.current.find(
            (p, index) => {
              if (p.peerID === payload.id){
                peersRef.current[index].userIdentity = payload.userIdentity;

                // receiving message from this peer
                p.peer.on("data", (data) => {
                  // clearTimeout(alertTimeout);
                  messageListReducer({
                    type: "addMessage",
                    payload: {
                      user: payload.userIdentity,
                      msg: data.toString(),
                      time: Date.now(),
                    },
                  });

                  if (!isMessenger) setMessageAlert(true);
                  chatNotificationAudio.play();
                });

                p.peer.signal(payload.signal); // accepting the returned signal
                return true;
              }
              return false;
            }
          )
          // this completes the handshake
          setPeers([...peersRef.current]);
        });

        socketRef.current.on("user left", payload => {
          const userId = payload.id;
          const alias = payload.alias;
          const peerObj = peersRef.current.find((p) => p.peerID === userId);
          if (peerObj) {
            peerObj.peer.destroy(); // remove all the connections and event handlers associated with this peer
          }
          const peers = peersRef.current.filter((p) => p.peerID !== userId); // removing this userId from peers
          peersRef.current = peers; // update peersRef
          setPopUp(`2 ${alias}`)
          setPeers(peers); // also update the state to remove the left user's video from screen
        });
      })
      .catch(() => {
        setLoading(false);
        setPopUp("connection timed out");
      });
    }, 2000);
  }

  useEffect(() => {
      if (!isLoading){
        if (!isAuthenticated){
          setPopUp("auth");
        }
        else{
          if (!props.location.state){
            setPopUp("Forbidden");
          }
          else{
            setLoading(true);
            socketRef.current = io.connect("/"); // connecting with the socket.io server

            // if the user is not admin, ask for permission to join the call
            if (!props.location.state.admin){
              const timer = setInterval(() => {
                waitingAudio.play();
              }, 100);
              setPopUp("Waiting")
              const userAlias = ("given_name" in user && user.given_name.length > 0 ?
                                  `${user.given_name} ${user.family_name}` : 
                                  user.email);

              socketRef.current.emit("permission", {user: userAlias, room: roomID, email: user.email});

              socketRef.current.on("no permit required", () => {
                // fetch the chat messages
                getChatMsgs(roomID)
                .then(messages => {
                  if (messages.length > 0) setMessageAlert(true);
                  messages.forEach(message => {
                    const userIdentity = ("first_name" in message.sender && message.sender.first_name.length > 0 ?
                                          `${message.sender.first_name} ${message.sender.last_name}` : 
                                          message.sender.email);
                    const payload = {
                      user: userIdentity,
                      msg: message.text,
                      time: message.created
                    }
                    initialState.push(payload);
                  })
                    
                  waitingAudio.pause();
                  clearInterval(timer);
                  joinPersonIn();
                })
                .catch(() => {
                  setLoading(false);
                  setPopUp("connection timed out");
                })
              })

              socketRef.current.on("allowed", chatId => {
                // allowed in the call
                // add this user to the chat
                addUser(user.email, chatId)
                .then(() => {
                  // fetch the chat messages
                  getChatMsgs(roomID)
                  .then(messages => {
                    if (messages.length > 0) setMessageAlert(true);
                    messages.forEach(message => {
                      const userIdentity = ("first_name" in message.sender && message.sender.first_name.length > 0 ?
                                          `${message.sender.first_name} ${message.sender.last_name}` : 
                                          message.sender.email);
                      const payload = {
                        user: userIdentity,
                        msg: message.text,
                        time: message.created
                      }
                      initialState.push(payload);
                    })
                    waitingAudio.pause();
                    clearInterval(timer);
                    joinPersonIn();
                  })  
                  .catch(() => {
                    // error in fetching chat messages
                    setLoading(false);
                    setPopUp("connection timed out");
                  })
                })
                .catch(() => {
                  // error in adding user to chat

                  setLoading(false);
                  // redirect the user to videochat home page
                  setPopUp("connection timed out");
                });
              })

              socketRef.current.on("denied", () => {
                waitingAudio.pause();
                clearInterval(timer);

                setTimeout(() => {
                  errorAudio.play();
                  setLoading(false);
                  setPopUp("denied to join");
                  // redirect the user to videochat home page
                }, 1000);
              }) 
            }
            else{
              // fetch the chat messages
              getChatMsgs(roomID)
              .then(messages => {
                if (messages.length > 0) setMessageAlert(true);
                messages.forEach(message => {
                  const userIdentity = ("first_name" in message.sender && message.sender.first_name.length > 0 ?
                                        `${message.sender.first_name} ${message.sender.last_name}` : 
                                        message.sender.email);
                  const payload = {
                    user: userIdentity,
                    msg: message.text,
                    time: message.created
                  }
                  initialState.push(payload);
                })
                joinPersonIn();
              })
              .catch(() => {
                // error in fetching chat messages
                setLoading(false);
                setPopUp("connection timed out");
              })
            }
          }
        }
      }
  }, [isLoading]);

  function createPeer(partnerId, myStream, myAlias) {
    // If I am joining the room, I am the initiator
    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          {
            urls: "stun:stun.stunprotocol.org",
          },
          {
            urls: "turn:34.145.184.179:3478?transport=tcp",
            username: "kurento",
            credential: "kurento",
          },
        ],
      },
    });

    if (audioTrack.current) peer.addTrack(audioTrack.current, myStream);
    if (videoTrack.current) peer.addTrack(videoTrack.current, myStream);

    // since here initiator is true, whenever peer is created it signals
    // and the below function gets called
    peer.on("signal", (signal) => {
      socketRef.current.emit("offer", {
        userToSignal: partnerId,
        userIdentity: myAlias,
        callerID: socketRef.current.id,
        signal,
      });
    });

    peer.on("connect", () => {
      // wait for connect event before using the data channel
    });
    return peer;
  }

  function addPeer(incomingSignal, callerID, userIdentity, myStream, myAlias) {
    // since I am receiving the offer, initiator = false
    const peer = new Peer({
      initiator: false,
      trickle: false,
      config: {
        iceServers: [
          {
            urls: "stun:stun.stunprotocol.org",
          },
          {
            urls: "turn:34.145.184.179:3478?transport=tcp",
            username: "kurento",
            credential: "kurento",
          },
        ],
      },
    });

    if (audioTrack.current) peer.addTrack(audioTrack.current, myStream);
    if (videoTrack.current) peer.addTrack(videoTrack.current, myStream);

    // here initiator is false,
    // so the below event is fired only when our peer accepts the incomingSignal
    // i.e peer.signal(incomingSignal) will fire the below function
    peer.on("signal", (signal) => {
      socketRef.current.emit("answer", { signal, callerID, userIdentity: myAlias });
    });

    peer.on("connect", () => {
      // wait for connect event before using the data channel
    });

    // receiving message from this peer
    peer.on("data", (data) => {
      // clearTimeout(alertTimeout);
      messageListReducer({
        type: "addMessage",
        payload: {
          user: userIdentity,
          msg: data.toString(),
          time: Date.now(),
        },
      });

      if (!isMessenger) setMessageAlert(true);
      chatNotificationAudio.play();    
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const shareScreen = () => {
    navigator.mediaDevices.getDisplayMedia({ cursor: true }).then((stream) => {
      setScreenShared(true);

      // store the video track i.e. our web cam stream into tmpTrack
      // and replace the video track with our screen track
      // so that it will be streamed on our screen as well as to our remote peers
      userVideo.current.srcObject = stream;
      screenTrack.current = stream.getTracks()[0];
      tmpTrack.current = videoTrack.current;
      videoTrack.current = screenTrack.current;

      peersRef.current.forEach((peerObj) => {
        peerObj.peer.replaceTrack(
          tmpTrack.current, // prev video track - webcam
          videoTrack.current, // current video track - screen track
          userStream.current
        );
      });

      screenTrack.current.onended = () => {
        stopShareScreen();
      };
    });
  };

  const stopShareScreen = () => {
    setScreenShared(false);

    // restore the videoTrack which was stored earlier in tmpTrack when screensharing was turned on
    videoTrack.current = tmpTrack.current;

    // stop the screentrack
    screenTrack.current.stop();

    // reassign our stream to the prev stream i.e. to that consisting of webcam video and audio
    userVideo.current.srcObject = userStream.current;

    // replace the screenTrack with videotrack for each remote peer
    peersRef.current.forEach((peerObj) => {
      peerObj.peer.replaceTrack(
        screenTrack.current,
        videoTrack.current,
        userStream.current
      );
    });
  };

  const endCall = () => {
    // play the call ending sound
    hangUpAudio.play();

    // stop all tracks - audio and video
    if (userStream.current){
      userStream.current.getTracks().forEach((track) => track.stop());
    }
    socketRef.current.disconnect();
    props.history.push("/videochat");
  };

  const muteVideo = () => {
    if (userVideo.current.srcObject) {
      if (!screenShared) {
        videoTrack.current.enabled = !videoTrack.current.enabled;
      }
    }
    setVideoMuted((prevStatus) => !prevStatus);
  };

  const muteAudio = () => {
    if (userVideo.current.srcObject) {
      audioTrack.current.enabled = !audioTrack.current.enabled;
    }
    setAudioMuted((prevStatus) => !prevStatus);
  };

  
  const sendMsg = (msg) => {
    // also send the message in the backend
    sendChatMsg(roomID, user.email, msg)
    .then(() => {
      if (peers.length === 0){
        // only I am in the chat
        messageListReducer({
          type: "addMessage",
          payload: {
            user: "You",
            msg: msg,
            time: Date.now()
          }
        })
      }
      else{
        peersRef.current.forEach(peerObj => {
          const peer = peerObj.peer;
          peer.send(msg);
          messageListReducer({
            type: "addMessage",
            payload: {
              user: "You",
              msg: msg,
              time: Date.now(),
            },
          });
        })
      }
    })
    .catch(() => {
      setPopUp("connection timed out");
    })
  };

  if (popUp === "connection timed out"){
    return (
      <AlertDialog
        title="ERR Connection Timed Out!"
        message="Please check your internet connection and try again."
        showLeft={false}
        showRight={true}
        btnTextRight="OK"
        auto={false}
        onClose={() => {
          setPopUp('');
          window.location.href = window.location.origin + "/videochat";
        }}
        onRight={() => {
          setPopUp('');
          window.location.href = window.location.origin + "/videochat";
        }}
      />
    )
  }

  if (popUp === "auth"){
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

  if (popUp === "Forbidden"){
    return (
      <AlertDialog
        title="Forbidden!"
        message="You cannot visit this page directly. Please use the application's home page to start a new meeting or join an existing one."
        showLeft={false}
        showRight={false}
        auto={true}
        time={5000}
        onClose={() => window.location.href = window.location.origin + "/videochat"}
      />
    )
  }

  if (popUp === "denied to join"){
    // popup closes automatically after 4 second
    return (
      <AlertDialog
        title="Permission denied!"
        message="You were denied to join the call by the meeting admin. You will shortly be redirected to videochat's home page."
        showLeft={false}
        showRight={false}
        auto={true}
        time={5000}
        onClose={() => {
          window.location.href = window.location.origin + "/videochat";
        }}
      />
    )
  }

  if (!props.location.state) return <div id="room"></div>
  return (
    <div id="room">
      {
        isMessenger && (
          <Messenger
            setIsMessenger={setIsMessenger}
            sendMsg={sendMsg}
            messageList={messageList}
          />
        )
      } 
      {
        popUp[0] === '1' && (
            <AlertDialog
              title="Join request!"
              message={`${popUp.substr(2)} is requesting to join the call.`}
              showLeft={true}
              showRight={true}
              auto={false}
              btnTextLeft={"Deny Entry"}
              btnTextRight={"Admit"}
              // onClose equivalent to deny
              onClose={() => {
                socketRef.current.emit("permit status", {allowed: false, id: joiningSocket.current});
                setPopUp('');
              }}
              onLeft={() => {
                socketRef.current.emit("permit status", {allowed: false, id: joiningSocket.current});
                setPopUp('');
              }}
              onRight={() => {
                socketRef.current.emit("permit status", {allowed: true, id: joiningSocket.current});
                setPopUp('');
              }}
            />
        )
      }
      {
        popUp === "meet link copied" && (
          <AlertDialog
              title="Meeting Code copied to Clipboard."
              message="Share with those whom you would like to join here and ask them to enter the code on the videochat's home page."
              showLeft={false}
              showRight={true}
              auto={false}
              btnTextRight={"Ok"}
              onClose={() => {
                setPopUp('');
              }}
              onRight={() => {
                setPopUp('');
              }}
            />
        )
      }
      {
        popUp[0] === '2' && (
          <AlertDialog
              title="User left"
              message={`${popUp.substr(2)} has left the meeting.`}
              showLeft={false}
              showRight={true}
              btnTextRight={"OK"}
              auto={true}
              time={5000}
              onClose={() => {
                setPopUp('');
              }}
              onRight={() => {
                setPopUp('');
              }}
          />
        )
      }
      {
        popUp[0] === '3' && (
          <AlertDialog
              title="User joined"
              message={`${popUp.substr(2)} has joined the meeting.`}
              showLeft={false}
              showRight={true}
              btnTextRight={"OK"}
              auto={true}
              time={5000}
              onClose={() => {
                setPopUp('');
              }}
              onRight={() => {
                setPopUp('');
              }}
          />
        )
      }
      {
        loading && popUp === "Waiting" && (
          <AlertDialog
              title={<CircularProgress color="secondary"/>}
              message="Waiting for the meeting admin to let you in."
              showLeft={false}
              showRight={false}
              auto={false}
              keepOpen={true}
              onClose={() => {}}
          />
        )
      }
      <div id="grid-root">
        <GridList cellHeight="90vh" id="grid-list" cols={2} spacing={20}>
          <GridListTile
            key="1"
            cols={peers.length === 0 || screenShared ? 2 : 1}
            rows={2}
          >
            <video
              id="mine"
              muted
              controls
              ref={userVideo}
              autoPlay
              playsInline
            />
            <style jsx>
              {`
                #mine {
                  transform: ${screenShared
                    ? "rotateY(0deg)"
                    : "rotateY(180deg)"};
                }

                #mine::-webkit-media-controls-panel {
                  transform: ${screenShared
                    ? "rotateY(0deg)"
                    : "rotateY(180deg)"};
                }
              `}
            </style>
            <GridListTileBar title="You" titlePosition="top" />
          </GridListTile>
          {peers.map((peerObj) => {
            return (
              <GridListTile key={peerObj.peerID} cols={1} rows={2}>
                <PartnerVideo
                  key={peerObj.peerID}
                  peer={peerObj.peer}
                  user={peerObj.peerID}
                />
                <GridListTileBar
                  title={peerObj.userIdentity}
                  titlePosition="top"
                  actionPosition="right"
                />
              </GridListTile>
            );
          })}
        </GridList>
      </div>
      <nav id="video-controls">
        {
          width > 500 && 
          <h3 style={{ position: "absolute", left: `${width < 600 ? 7 : 20}px`, fontSize: "auto" }}>
          {new Date().toLocaleString("en-US", {
            hour12: true,
            hour: "numeric",
            minute: "numeric",
          })}
        </h3>
        }
        <div style={{ position: "absolute", left: `${width < 700 ? (width < 500 ? 30 : width * 20 / 100) : width * 38 / 100}px` }}>
          {!screenShared && (
            <MyToolTip
              title={userStream.current ? (videoMuted ? "Turn on Camera" : "Turn off Camera") : "Loading..."}
            >
              <IconButton
                onClick={() => {
                  // if video stream exists
                  if (userStream.current){
                    muteVideo();
                  }
                }}
                style={{
                  backgroundColor: videoMuted ? "#eb3f21" : "#404239",
                  margin: `${width < 600 ? 2 : 4}px`,
                }}
              >
                {videoMuted ? (
                  <span
                    className="material-icons-outlined"
                    style={{ color: "white" }}
                  >
                    videocam_off
                  </span>
                ) : (
                  <span
                    className="material-icons-outlined"
                    style={{ color: "white" }}
                  >
                    videocam
                  </span>
                )}
              </IconButton>
            </MyToolTip>
          )}

          <MyToolTip
            title={userStream.current ? (audioMuted ? "Turn on Microphone" : "Turn off Microphone"): "Loading..."}
          >
            <IconButton
              onClick={() => {
                // if audio stream exists
                if (userStream.current){
                  muteAudio();
                }
              }}
              style={{
                backgroundColor: audioMuted ? "#eb3f21" : "#404239",
                margin: `${width < 600 ? 2 : 4}px`
              }}
            >
              {audioMuted ? (
                <span className="material-icons" style={{ color: "white" }}>
                  mic_off
                </span>
              ) : (
                <span className="material-icons" style={{ color: "white" }}>
                  mic
                </span>
              )}
            </IconButton>
          </MyToolTip>

          <MyToolTip title={userStream.current ? (screenShared ? "Stop Presenting" : "Present Now") : "Loading..."}>
            <IconButton
              onClick={() => {
                // wait for stream to load first
                if (userStream.current){
                  if (screenShared) stopShareScreen();
                  else shareScreen();
                }
              }}
              style={{
                backgroundColor: screenShared ? "#8eb2f5" : "#404239",
                margin: `${width < 600 ? 2 : 4}px`
              }}
            >
              {screenShared ? (
                <span className="material-icons" style={{ color: "black" }}>
                  cancel_presentation
                </span>
              ) : (
                <span className="material-icons" style={{ color: "white" }}>
                  present_to_all
                </span>
              )}
            </IconButton>
          </MyToolTip>

          <MyToolTip title="Copy meeting Room">
            <IconButton
              onClick={() => {
                navigator.clipboard.writeText(roomID);
                setPopUp("meet link copied");
              }}
              style={{ backgroundColor: "#404239", margin: `${width < 600 ? 2 : 4}px` }}
            >
              <span className="material-icons" style={{ color: "white" }}>
                content_copy
              </span>
            </IconButton>
          </MyToolTip>

          <MyToolTip title={messageAlert ? "Unread messages" : "Chat with Everyone"}>
            <IconButton
              onClick={() => {
                setIsMessenger(prev => !prev);
                if (messageAlert){
                  setMessageAlert(false);
                }
              }}
              style={{ backgroundColor: "#404239", margin: `${width < 600 ? 2 : 4}px` }}
            >
              {
                !isMessenger ? 
                  (messageAlert ? 
                  <span class="material-icons-outlined" style={{ color: "white" }}>mark_chat_unread</span> : 
                  <span class="material-icons-outlined" style={{ color: "white" }}>chat</span>) : 
                (<span class="material-icons-outlined" style={{ color: "white" }}>chat_bubble</span>)
              }
            </IconButton>
          </MyToolTip>

          <MyToolTip title="Hang Up">
            <IconButton
              onClick={endCall}
              style={{ backgroundColor: "#eb3f21", margin: `${width < 600 ? 2 : 4}px` }}
            >
              <span className="material-icons" style={{ color: "white" }}>
                call_end
              </span>
            </IconButton>
          </MyToolTip>
        </div>
        <div style={{position: "absolute", right: `${width < 500 ? 20 : 10}px`}}>
        <MyToolTip title={`${peers.length + 1} participant${peers.length > 0 ? 's' : ''}`}>
            <IconButton
              onClick={() => {}}
              style={{ backgroundColor: "#404239", margin: `${width < 600 ? 2 : 4}px` }}
            >
              <span className="material-icons-outlined" style={{ color: "white" }}>
                people
              </span>
            </IconButton>
          </MyToolTip>
        </div>
      </nav>
    </div>
  );
};

export default Room;
