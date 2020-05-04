import React, { Component } from 'react'
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from 'react-router-dom';

// Routes
import Home from './home';
import Videochat from './Videochat/Videochat';

import openSocket from 'socket.io-client';


// const socket = openSocket(`http://${window.location.hostname}:5500`, {secure: false});

export default class routes extends Component {
  render() {
    return (
      <Router>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/:roomId" component={Videochat} />
        </Switch>
      </Router>
    )
  }
}
