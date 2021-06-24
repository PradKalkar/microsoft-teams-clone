/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";

const Container = styled.div`
  padding: 20px;
  display: flex;
  height: 100vh;
  width: 90%;
  margin: auto;
  flex-wrap: wrap;
`;

const StyledVideo = styled.video`
  height: 40%;
  width: 50%;
`;

const Video = (props) => {
  const ref = useRef();

  useEffect(() => {
    //   props.peer.on("trac")
    props.peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, []);

  return <StyledVideo controls playsInline autoPlay ref={ref} />;
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
        videoTrack.current =  userStream.current.getTracks()[1];
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
    });

    myStream.getTracks().forEach(track => peer.addTrack(track, myStream));


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
      trickle: false
    });

    myStream.getTracks().forEach(track => peer.addTrack(track, myStream));

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
    navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(stream => {
      screenTrack.current = stream.getTracks()[0]; 

      peersRef.current.forEach(peerObj => {
        peerObj.peer.replaceTrack(videoTrack.current, screenTrack.current, userStream.current);
      })
        
      screenTrack.current.onended = () => {
				peersRef.current.forEach(peerObj => {
					peerObj.peer.replaceTrack(screenTrack.current, videoTrack.current, userStream.current);
				})
      }
    });
  }

  const leaveRoom = () => {
    socketRef.current.disconnect();
    props.history.push("/");
  }

  return (
    <>
      <button onClick={leaveRoom}>Leave Call</button>
      <button onClick={shareScreen}>Share Screen</button>
      <Container>
        <StyledVideo controls muted ref={userVideo} autoPlay playsInline />
        {peers.map((peerObj) => {
          return <Video key={peerObj.peerID} peer={peerObj.peer} />;
        })}
      </Container>
    </>
  );
};

export default Room;
