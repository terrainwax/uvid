import React, { Component, useState  } from 'react'
import {Button, Card, Input, Row} from "antd";
import shortId from 'shortid'

let userName ;

export default class home extends Component {

    componentDidMount() {

    }

    onChange(value){
        userName = value.target.value;
    }

  render() {
      let roomId = shortId.generate();
      if (this.props !== undefined ) {
          if (this.props.location !== undefined ) {
              if (this.props.location.state !== undefined ) {
                  if (this.props.location.state.roomid !== undefined) {
                      roomId = this.props.location.state.roomid;
                  }
              }
          }
      }
    return (
      <div>

          <Row type="flex" justify="center" align="middle" style={{minHeight: '100vh'}}>
        <Card
            hoverable
            style={{ width: 240 }}
            cover={<img alt="example" src="https://devopedia.org/images/article/39/4276.1518788244.png" />}
        >
          <Input size="large" placeholder="UserName" onChange={this.onChange} />
          <Button size="large" type="primary" onClick={() => this.props.history.push({pathname:`/${roomId}`, state: { username: userName }})}>Create / Enter in room</Button>
        </Card>
          </Row>
      </div>
    )
  }
}
