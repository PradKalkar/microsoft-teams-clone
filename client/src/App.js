import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import VideoChat from "./routes/VideoChat";
import VideoChatHome from "./routes/VideoChatHome";
import HomePage from './components/HomePage';
import Chat from './components/Chat';
import './App.css'

const App = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/chat" exact component={Chat} />
        <Route path="/videochat" exact component={VideoChatHome} />
        <Route path="/" exact component={HomePage} />
        <Route path="/videochat/room/:roomID" component={VideoChat} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
