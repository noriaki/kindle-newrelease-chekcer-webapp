import React, { Component } from 'react';
import uuid from 'uuid/v4';

class IndexPage extends Component {
  static getInitialProps = async ({ req }) => {
    return { uuid: uuid() };
  }

  componentDidMount = () => {}

  render = () => {
    const { uuid } = this.props;
    return <div>Hello world / {uuid}</div>;
  }
}

export default IndexPage;
