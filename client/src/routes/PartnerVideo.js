import { IconButton } from "@material-ui/core";
import { useEffect, useRef, useState } from "react";
import MyToolTip from "./MyToolTip";
import FullscreenRoundedIcon from "@material-ui/icons/FullscreenRounded";
import styled from "styled-components";

const StyledVideo = styled.video`
  height: 70%;
  width: 80%;
`;

const PartnerVideo = (props) => {
  const [muted, setMuted] = useState(false);
  const videoRef = useRef();

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
    <div>
      <StyledVideo playsInline autoPlay ref={videoRef} />
      <div>
        <MyToolTip
          title={
            muted ? "Unmute participant for you" : "Mute participant for you"
          }
        >
          <IconButton
            onClick={muteAudio}
            style={{ backgroundColor: muted ? "#eb3f21" : "#404239" }}
          >
            {muted ? (
              <span className="material-icons" style={{ color: "white" }}>
                volume_off
              </span>
            ) : (
              <span className="material-icons" style={{ color: "white" }}>
                volume_up
              </span>
            )}
          </IconButton>
        </MyToolTip>
        <MyToolTip title="See participant's stream in Fullscreen mode">
          <IconButton
            onClick={fullScreen}
            style={{ backgroundColor: "#404239" }}
          >
            <FullscreenRoundedIcon style={{ color: "white" }} />
          </IconButton>
        </MyToolTip>
      </div>
    </div>
  );
};

export default PartnerVideo;
