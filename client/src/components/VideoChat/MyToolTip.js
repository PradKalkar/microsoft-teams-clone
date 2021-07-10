import { makeStyles } from '@material-ui/core/styles';
import { Tooltip, Zoom } from "@material-ui/core";

const useStyles = makeStyles(() => ({
  customSize: {
    fontSize: '18px'
  }
}));

const MyToolTip = (props) => {
  const classes = useStyles();

  return (
    <Tooltip
      classes={{ tooltip: classes.customSize }}
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
