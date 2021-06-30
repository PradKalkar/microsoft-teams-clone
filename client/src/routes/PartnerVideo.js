/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";

const PartnerVideo = (props) => {
  const videoRef = useRef();

  useEffect(() => {
    // on receiving remote user's stream attach it to this video element using ref
    props.peer.on("stream", (stream) => {
      videoRef.current.srcObject = stream;
    });
  }, []);

  return (
    <video controls playsInline autoPlay ref={videoRef} />
  );
};

export default PartnerVideo;
