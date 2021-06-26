import { Tooltip, Zoom } from "@material-ui/core";

const MyToolTip = (props) => {
  return (
    <Tooltip
      title={props.title}
      placement="top"
      arrow
      enterDelay="500"
      leaveDelay="200"
      TransitionComponent={Zoom}
    >
      {props.children}
    </Tooltip>
  );
};

export default MyToolTip;
