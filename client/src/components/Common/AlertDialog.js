/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Slide from "@material-ui/core/Slide";

const Transition = React.forwardRef(function Transition(props, ref) {
	return <Slide direction="down" ref={ref} {...props} />;
});

export default function AlertDialog(props) {
	const [open, setOpen] = React.useState(true);

	useEffect(() => {
		if (props.auto) {
			setTimeout(() => {
				handleClose();
			}, props.time);
		}
	}, []);

	const handleClose = () => {
		if (props.keepOpen) {
			// dont close the dialog
		} else {
			setOpen(false);
		}
		props.onClose();
	};

	const handleLeftButton = () => {
		if (props.keepOpen) {
			// dont close the dialog
		} else {
			setOpen(false);
		}
		props.onLeft();
	};

	const handleRightButton = () => {
		if (props.keepOpen) {
			// dont close the dialog
		} else {
			setOpen(false);
		}
		props.onRight();
	};

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			TransitionComponent={Transition}
			keepMounted
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<DialogTitle id="alert-dialog-title">{props.title}</DialogTitle>
			<DialogContent>
				<DialogContentText id="alert-dialog-description">
					{props.message}
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				{props.showLeft && (
					<Button onClick={handleLeftButton} color="primary">
						{props.btnTextLeft}
					</Button>
				)}
				{props.showRight && (
					<Button
						onClick={handleRightButton}
						color="primary"
						autoFocus
						style={{ display: props.showRight ? "block" : "none" }}
					>
						{props.btnTextRight}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}
