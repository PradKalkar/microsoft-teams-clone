/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import { Button } from "@material-ui/core";

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

const Div = styled.div`
  margin: 5px;
`;

const Video = (props) => {
  const [muted, setMuted] = useState(false);
  const videoRef = useRef();
  const buttonRef = useRef();

  useEffect(() => {
    //   props.peer.on("trac")
    props.peer.on("stream", (stream) => {
      videoRef.current.srcObject = stream;
    });
  }, []);

  const muteAudio = () => {
    if (videoRef.current.muted) {
      videoRef.current.muted = false;
      setMuted(false);
    } else {
      videoRef.current.muted = true;
      setMuted(true);
    }
  };

  const fullScreen = () => {
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if (videoRef.current.mozRequestFullScreen) {
      videoRef.current.mozRequestFullScreen(); // Firefox
    } else if (videoRef.current.webkitRequestFullscreen) {
      videoRef.current.webkitRequestFullscreen(); // Chrome and Safari
    }
  };

  return (
    <Div>
      <StyledVideo playsInline autoPlay ref={videoRef} />
      <Div>
        <Button
          style={{ position: "relative", left: "100px" }}
          variant="contained"
          color="primary"
          onClick={muteAudio}
          ref={buttonRef}
        >
          {muted ? "Unmute" : "Mute"}
        </Button>
        <Button
          style={{ position: "relative", left: "150px" }}
          variant="contained"
          color="primary"
          onClick={fullScreen}
        >
          Full Screen
        </Button>
      </Div>
    </Div>
  );
};

const videoConstraints = {
  height: window.innerHeight / 2,
  width: window.innerWidth / 2,
};

const Room = (props) => {
  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const userVideo = useRef();
  const userStream = useRef();
  const audioTrack = useRef();
  const videoTrack = useRef();
  const screenTrack = useRef();
  const peersRef = useRef([]); // array of peer objects
  const roomID = props.match.params.roomID;

  useEffect(() => {
    socketRef.current = io.connect("/"); // connecting with the socket.io server

    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio: true })
      .then((myStream) => {
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
      screenTrack.current = stream.getTracks()[0];

      peersRef.current.forEach((peerObj) => {
        peerObj.peer.replaceTrack(
          videoTrack.current,
          screenTrack.current,
          userStream.current
        );
      });

      screenTrack.current.onended = () => {
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

  const leaveRoom = () => {
    userStream.current.getTracks().forEach(track => track.stop());
    socketRef.current.disconnect();
    props.history.push("/");
  };

  const muteVideo = () => {
    if (userVideo.current.srcObject) {
      // userVideo.current.srcObject.getTracks()[0].disable();
      const original = userVideo.current.srcObject.getVideoTracks()[0].enabled;
      userVideo.current.srcObject.getVideoTracks()[0].enabled = !original;
    }
  };

  const muteAudio = () => {
    if (userVideo.current.srcObject) {
      // userVideo.current.srcObject.getTracks()[0].disable();
      const original = userVideo.current.srcObject.getAudioTracks()[0].enabled;
      userVideo.current.srcObject.getAudioTracks()[0].enabled = !original;
    }
  };

  return (
    <>
      <Button variant="contained" color="primary" onClick={muteVideo}>
        Mute Video
      </Button>
      <Button variant="contained" color="primary" onClick={muteAudio}>
        Mute Audio
      </Button>
      <Button variant="contained" color="primary" onClick={leaveRoom}>
        Leave Call
      </Button>
      <Button variant="contained" color="primary" onClick={shareScreen}>
        Share Screen
      </Button>
      <Container>
        <Div>
          <StyledVideo muted ref={userVideo} autoPlay playsInline />
          <Div>
            <Button></Button>
            <Button></Button>
          </Div>
        </Div>
        {peers.map((peerObj) => {
          return (
            <Video
              key={peerObj.peerID}
              peer={peerObj.peer}
              user={peerObj.peerID}
            />
          );
        })}
      </Container>
    </>
  );
};

export default Room;
