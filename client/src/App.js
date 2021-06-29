import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./routes/CreateRoom";
import Room from "./routes/Room";
import GoogleButton from 'react-google-button'
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
    <div>
      <h1>Home Page</h1>
      <GoogleButton onClick={() => {
        window.location.href='https://pradnesh-msteams-clone.azurewebsites.net/.auth/login/google';
      }}/>
    </div>
  )
}

export default App;
