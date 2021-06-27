import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Auth from './routes/Auth';
import CreateRoom from "./routes/CreateRoom";
import Room from "./routes/Room";
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/auth" exact component={Auth} />
        <Route path="/" exact component={CreateRoom} />
        <Route path="/room/:roomID" component={Room} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
