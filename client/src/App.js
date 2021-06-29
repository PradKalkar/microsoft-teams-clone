import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./routes/CreateRoom";
import Room from "./routes/Room";
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={HomePage} />
        <Route path="/videochat" exact component={CreateRoom} />
        <Route path="/videochat/room/:roomID" component={Room} />
      </Switch>
    </BrowserRouter>
  );
}

function HomePage() {
  return (
    <h1>Home Page</h1>
  )
}

export default App;
