import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Room from "./routes/Room";
import VideoChatHome from "./routes/VideoChatHome";
import './App.css'

function App() {
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

function HomePage() {
  return (
    <div>
      <h1>Home Page</h1>
    </div>
  )
}

export default App;
