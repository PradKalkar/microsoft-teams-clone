import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Room from "./routes/Room";
import VideoChatHome from "./routes/VideoChatHome";
import HomePage from './components/HomePage';
import './App.css'

const App = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/videochat" exact component={VideoChatHome} />
        <Route path="/" exact component={HomePage} />
        <Route path="/videochat/room/:roomID" component={Room} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
