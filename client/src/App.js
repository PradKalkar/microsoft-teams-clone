import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import VideoChat from "./components/VideoChat/VideoChat";
import VideoChatHome from "./components/VideoChat/VideoChatHome/VideoChatHome";
import HomePage from "./components/HomePage";
import Chat from "./components/Chat/Chat";
import ErrorPage from "./components/Common/ErrorPage";
import "./App.css";

const App = () => {
	return (
		<BrowserRouter>
			<Switch>
				<Route path="/chat" exact component={Chat} />
				<Route path="/videochat" exact component={VideoChatHome} />
				<Route path="/" exact component={HomePage} />
				<Route path="/videochat/room/:roomID" component={VideoChat} />
				<Route path="*" component={ErrorPage} />
			</Switch>
		</BrowserRouter>
	);
};

export default App;
