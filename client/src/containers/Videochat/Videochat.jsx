import React, { Component } from 'react';
import Peer from 'simple-peer';
import openSocket from "socket.io-client";
import {ShareScreenIcon,MicOnIcon,MicOffIcon,CamOnIcon,CamOffIcon} from '../Icons';
import {Col, Row} from "antd";

const PORT = process.env.PORT || 5000;
//const socket = openSocket(`https://${window.location.hostname}:${PORT}`, {secure: true});
const socket = openSocket(`https://${window.location.hostname}`, {secure: true});



export default class Videochat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ownPeer: '',
      localPeer:{},
      localStream: {},
      remoteStreamUrl: '',
      streamUrl: '',
      initiator: false,
      peer: {},
      full: false,
      connecting: false,
      waiting: true,
      micState:true,
      camState:true,
      peers: []
    }
  }

  componentDidMount() {
    const {roomId} = this.props.match.params;
    if (this.props.location.state === undefined || this.props.location.state.username === undefined) {
      this.props.history.push({pathname: `/`, state: {roomid: roomId}});
    return;
    }
    this.getUserMedia();


    socket.on('connectToPeer', data => {
      this.updatePeer();
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true, }).then(stream => {
        var video = document.createElement("video");
        this.setState({ streamUrl: stream, localStream: stream });
        this.localVideo.srcObject = stream;
        let peer = new Peer({
          initiator: false,
          trickle: false,
          stream,
        });

        peer.signal(JSON.parse(data.peer));

        peer.on('signal', peer => {
          if (peer.renegotiate) return
          peer = JSON.stringify(peer)
          socket.emit('finalHandshake', { peer, index: data.index, socket: data.socket })
        })

        peer.on('stream', stream => {
          document.querySelector('#videos').appendChild(video)
          video.srcObject = stream;
          video.onloadedmetadata = function (e) {
            video.play();
          };
        })

        peer.on('close', () => {
          video.remove();
        })

        peer.on('error', (err) => {
          if (err.code === "ERR_CONNECTION_FAILURE")
            video.remove();
        })
      })
    })


    socket.on('finalHandshake', data => {
      const peer = this.state.peers[data.index];
      peer.signal(JSON.parse(data.peer));

      peer.on('stream', stream => {
        var video = document.createElement("video");
        document.querySelector('#videos').appendChild(video)
        video.srcObject = stream;
        video.onloadedmetadata = function (e) {
          video.play();
        };
      })

      this.updatePeer()
    })



    socket.emit('join', { roomId: roomId }, ( group ) => {
      socket.emit('addUser', { roomId: roomId }, () => {
        this.getAllUsers()
      })
    })
  }

  getAllUsers() {
    const { roomId } = this.props.match.params;
    socket.emit('getAllUsers', { roomId: roomId } , group => {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true, }).then(stream => {
        this.setState({ streamUrl: stream, localStream: stream });
        this.localVideo.srcObject = stream;
        group.users.forEach(user => {
          // DO NOT CONNECT WITH YOURSELF
          if (user.socketId === socket.id) return;
          let peer = new Peer({
            initiator: true,
            trickle: false,
            stream
          });


          this.addPeerToPeers(peer).then(index => {
            this.setState({localPeer :  this.state.peers[index]}, () => {
              this.state.peers[index].on('signal', data => {
                let peerId = JSON.stringify(data);
                this.setState({ ownPeer: peerId })
                socket.emit('connectToPeer', { peer: peerId, index, socket: user.socketId })
              })
            });

          })
        })
      })

      if(group.users.length === 1) {
        this.updatePeer();
      }
    })
  }

  getUserMedia(cb) {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia = navigator.getUserMedia =
          navigator.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia;
      const op = {
        video: {
          width: { min: 160, ideal: 640, max: 1280 },
          height: { min: 120, ideal: 360, max: 720 }
        },
        audio: true
      };
      navigator.getUserMedia(
          op,
          stream => {
            this.setState({ streamUrl: stream, localStream: stream });
            this.localVideo.srcObject = stream;
            resolve();
          },
          () => {}
      );
    });
  }

  setAudioLocal(){
    if(this.state.localStream.getAudioTracks().length>0){
      this.state.localStream.getAudioTracks().forEach(track => {
        track.enabled=!track.enabled;
      });
    }
    this.setState({
      micState:!this.state.micState
    })
  }

  setVideoLocal(){
    if(this.state.localStream.getVideoTracks().length>0){
      this.state.localStream.getVideoTracks().forEach(track => {
        track.enabled=!track.enabled;
      });
    }
    this.setState({
      camState:!this.state.camState
    })
  }

  getDisplay() {
    navigator.mediaDevices.getDisplayMedia().then(stream => {
      stream.oninactive = () => {
        this.state.localPeer.removeStream(this.state.localStream);
        this.getUserMedia().then(() => {
          this.state.localPeer.addStream(this.state.localStream);
        });
      };
      this.setState({ streamUrl: stream, localStream: stream });
      this.localVideo.srcObject = stream;
      this.state.localPeer.addStream(stream);
    });
  }

  addPeerToPeers(peer) {
    return new Promise(resolve => {
      let peers = this.state.peers;
      peers.push(peer);

      this.setState({ peers: peers }, () => {
        console.log(this.state.peers);
        resolve(peers.length - 1);
      })
    })
  }

  updatePeer() {
    return new Promise(resolve => {
      navigator.mediaDevices.getUserMedia({video: {facingMode: "environment"}, audio: true,}).then(stream => {
        let stre = this.state.localStream;
        let peer = new Peer({
          initiator: true,
          trickle: false,
          stre
        });

        const {roomId} = this.props.match.params;
        this.addPeerToPeers(peer).then(index => {
          this.setState({localPeer: this.state.peers[index]}, () => {
            this.state.peers[index].on('signal', data => {
              let peerid = JSON.stringify(data);
              this.setState({ownPeer: peerid})
              socket.emit('updateUser', {roomId: roomId, peer: data, index})
              resolve();
            })
          })
        })
      })
    })
  }

  render() {
    return (
      <div>
        <Row>
          <Col  id="videos" span={18} push={6}>

          </Col>
          <Col span={6} pull={18}>
            <video autoPlay muted id="ownVideo" ref={video => (this.localVideo = video)}></video>
          </Col>
        </Row>
        <div className='controls'>
          <button
              className='control-btn'
              onClick={() => {
                this.getDisplay();
              }}
          >
            <ShareScreenIcon />
          </button>


          <button
              className='control-btn'
              onClick={() => {
                this.setAudioLocal();
              }}
          >
            {
              this.state.micState?(
                  <MicOnIcon></MicOnIcon>
              ):(
                  <MicOffIcon></MicOffIcon>
              )
            }
          </button>

          <button
              className='control-btn'
              onClick={() => {
                this.setVideoLocal();
              }}
          >
            {
              this.state.camState?(
                  <CamOnIcon></CamOnIcon>
              ):(
                  <CamOffIcon></CamOffIcon>
              )
            }
          </button>
        </div>
      </div >
    )
  }
}
