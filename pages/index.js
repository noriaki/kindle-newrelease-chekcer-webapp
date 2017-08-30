import React, { Component } from 'react';
import Cookies from 'js-cookie';
import fetch from 'isomorphic-fetch';
import Dexie from 'dexie';

class IndexPage extends Component {
  componentDidMount = async () => {
    const db = new Dexie('kindle-newrelease-chekcer-webapp-db');
    db.version(1).stores({ sessions: '&identifier,token' });
    const identifier = Cookies.get('identifier');
    const body = JSON.stringify(identifier ? { identifier } : {});
    const { user, token } = await fetch('/api/v1/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
    }).then(res => res.json());
    Cookies.set('identifier', user.identifier);
    Cookies.set('token', token);
    const dbQuery = db.sessions.where('identifier').equals(identifier);
    const currentSession = await dbQuery.first();
    console.log(currentSession);
    if (currentSession == null) {
      await db.sessions.add({ identifier: user.identifier, token });
    } else {
      await dbQuery.modify({ token });
    }
  }

  render = () => {
    return <div>Hello world</div>;
  }
}

export default IndexPage;
