/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, useReducer } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import { IconButton } from "@material-ui/core";
import MyToolTip from "./MyToolTip";
import useWindowDimensions from "../hooks/useWindowDimensions";
import PartnerVideo from './PartnerVideo';

const Container = styled.div`
  padding: 20px;
  display: flex;
  height: 100vh;
  width: 90%;
  margin: auto;
  flex-wrap: wrap;
`;

const StyledVideo = styled.video`
  height: 70%;
  width: 80%;
`;

const videoConstraints = {
  height: window.innerHeight / 2,
  width: window.innerWidth / 2,
};

const Room = (props) => {
  // dynamic height and width of webpage
  const { width } = useWindowDimensions();
  const [peers, setPeers] = useState([]);
  const [videoMuted, setVideoMuted] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [screenShared, setScreenShared] = useState(false);
  const socketRef = useRef();
  const userVideo = useRef();
  const userStream = useRef();
  const audioTrack = useRef();
  const videoTrack = useRef();
  const screenTrack = useRef();
  const peersRef = useRef([]); // array of peer objects
  const roomID = props.match.params.roomID;

  const isAdmin = window.location.hash === "#init" ? true : false;
  const url = `${window.location.origin}${window.location.pathname}`;

  // when a user presses the back button, disconnect the socket
  window.onpopstate = () => {
    userStream.current.getTracks().forEach((track) => track.stop());
    socketRef.current.disconnect();
  }

  useEffect(() => {
    socketRef.current = io.connect("/"); // connecting with the socket.io server

    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio: true })
      .then((myStream) => {
        if (isAdmin){
          alert(`Copy the meeting url (leaving the #init part) and share it with those whom you want to join.`)
        }
        userStream.current = myStream;
        videoTrack.current = userStream.current.getTracks()[1];
        audioTrack.current = userStream.current.getTracks()[0];

        userVideo.current.srcObject = myStream;
        socketRef.current.emit("join room", roomID);

        // this is received by the user who just joined
        // we get all the users present in the room
        socketRef.current.on("all other users", (partners) => {
          // create a peer for us corresponding to connection to every other user in the room
          partners.forEach((partnerId) => {
            const peer = createPeer(partnerId, myStream);
            peersRef.current.push({
              peerID: partnerId, // this particular peer is representing conection b/w me and partnerId
              peer,
            });
          });
          setPeers([...peersRef.current]); // update the state to render their streams
        });

        // this event is received by a user who is already present within the room
        // so we need to add peer corresponding to the new comer
        // we are also receiving peer signal(offer) from new comer
        socketRef.current.on("user joined", (payload) => {
          const peer = addPeer(payload.signal, payload.callerID, myStream);
          peersRef.current.push({
            peerID: payload.callerID,
            peer, // this is equivalent to peer: peer
          });

          // add new peerobj to peers state
          setPeers([...peersRef.current]);
        });

        // now the peer who has joined just now is receiving the retrned signal
        // from the peers to whom it had sent signal to
        socketRef.current.on("answer", (payload) => {
          // finding the corresponding peer which is item.peer
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          item.peer.signal(payload.signal); // accepting the returned signal
          // this completes the handshake
        });

        socketRef.current.on("user left", (userId) => {
          const peerObj = peersRef.current.find((p) => p.peerID === userId);
          if (peerObj) {
            // remove all the connections and event handlers associated with this peer
            peerObj.peer.destroy();
          }
          const peers = peersRef.current.filter((p) => p.peerID !== userId); // removing this userId from peers

          // update peersRef
          peersRef.current = peers;

          // also update the state to remove the left user's video from screen
          setPeers(peers);
        });
      });
  }, []);

  function createPeer(partnerId, myStream) {
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
            urls: "turn:numb.viagenie.ca",
            credential: "muazkh",
            username: "webrtc@live.com",
          },
        ],
      },
    });

    myStream.getTracks().forEach((track) => peer.addTrack(track, myStream));

    // since here initiator is true, whenever peer is created it signals
    // and the below function gets called
    peer.on("signal", (signal) => {
      socketRef.current.emit("offer", {
        userToSignal: partnerId,
        callerID: socketRef.current.id,
        signal,
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, myStream) {
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
            urls: "turn:numb.viagenie.ca",
            credential: "muazkh",
            username: "webrtc@live.com",
          },
        ],
      },
    });

    myStream.getTracks().forEach((track) => peer.addTrack(track, myStream));

    // here initiator is false,
    // so the below event is fired only when our peer accepts the incomingSignal
    // i.e peer.signal(incomingSignal) will fire the below function
    peer.on("signal", (signal) => {
      socketRef.current.emit("answer", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const shareScreen = () => {
    navigator.mediaDevices.getDisplayMedia({ cursor: true }).then((stream) => {
      setScreenShared(true);
      screenTrack.current = stream.getTracks()[0];

      peersRef.current.forEach((peerObj) => {
        peerObj.peer.replaceTrack(
          videoTrack.current,
          screenTrack.current,
          userStream.current
        );
      });

      screenTrack.current.onended = () => {
        console.log("On ended called");
        setScreenShared(false);
        peersRef.current.forEach((peerObj) => {
          peerObj.peer.replaceTrack(
            screenTrack.current,
            videoTrack.current,
            userStream.current
          );
        });
      };
    });
  };

  const stopShareScreen = () => {
    screenTrack.current.stop();
    setScreenShared(false);
    peersRef.current.forEach((peerObj) => {
      peerObj.peer.replaceTrack(
        screenTrack.current,
        videoTrack.current,
        userStream.current
      );
    });
  };

  const leaveRoom = () => {
    userStream.current.getTracks().forEach((track) => track.stop());
    socketRef.current.disconnect();
    props.history.push("/videochat");
    
    // stop the page from accessing camera and microphone
    window.location.reload();
  };

  const muteVideo = () => {
    if (userVideo.current.srcObject) {
      // userVideo.current.srcObject.getTracks()[0].disable();
      const original = userVideo.current.srcObject.getVideoTracks()[0].enabled;
      userVideo.current.srcObject.getVideoTracks()[0].enabled = !original;
    }
    setVideoMuted(!videoMuted);
  };

  const muteAudio = () => {
    if (userVideo.current.srcObject) {
      // userVideo.current.srcObject.getTracks()[0].disable();
      const original = userVideo.current.srcObject.getAudioTracks()[0].enabled;
      userVideo.current.srcObject.getAudioTracks()[0].enabled = !original;
    }
    setAudioMuted(!audioMuted);
  };

  return (
    <div style={{backgroundColor: 'rgb(39, 39, 44)'}}>
      <Container>
        <div>
          <StyledVideo muted ref={userVideo} autoPlay playsInline />
        </div>
        {peers.map((peerObj) => {
          return (
            <PartnerVideo
              key={peerObj.peerID}
              peer={peerObj.peer}
              user={peerObj.peerID}
            />
          );
        })}
      </Container>
      <nav>
        <h3 style={{position: 'absolute', left: width / 100 * 2}}>
          { new Date().toLocaleString('en-US', { hour12: true, hour: "numeric", minute: "numeric", weekday: 'long'})}
        </h3>
        <div style={{position: 'absolute', left: width / 100 * 41}}>
        <MyToolTip title={videoMuted ? "Turn on Camera" : "Turn off Camera"}>
          <IconButton
            onClick={muteVideo}
            style={{ backgroundColor: videoMuted ? "#eb3f21" : "#404239", margin: width/1000 * 5 }}
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

        <MyToolTip
          title={audioMuted ? "Turn on Microphone" : "Turn off Microphone"}
        >
          <IconButton
            onClick={muteAudio}
            style={{ backgroundColor: audioMuted ? "#eb3f21" : "#404239", margin: width/1000 * 5 }}
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

        <MyToolTip title={screenShared ? "Stop Presenting" : "Present Now"}>
          <IconButton
            onClick={() => {
              if (screenShared) stopShareScreen();
              else shareScreen();
            }}
            style={{
              backgroundColor: screenShared ? "#8eb2f5" : "#404239",
              margin: width/1000 * 5
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

        <MyToolTip title="Leave Call">
          <IconButton
            onClick={leaveRoom}
            style={{ backgroundColor: "#eb3f21", margin: width/1000 * 5 }}
          >
            <span className="material-icons" style={{ color: "white" }}>
              call_end
            </span>
          </IconButton>
        </MyToolTip>
        </div>
        <h5 style={{position: 'absolute', right: width / 100 * 3}}>
          {props.match.params.roomID}
        </h5>
      </nav>
    </div>
  );
};

export default Room;
