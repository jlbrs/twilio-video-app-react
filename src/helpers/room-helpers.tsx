import { Steps } from '../components/PreJoinScreens/PreJoinScreens';
import axios from 'axios';
import { SyncClient } from 'twilio-sync';
import { useState } from 'react';

export function checkMeetingId(
  meetingId: string,
  setSyncInfo: (arg0: { document: any; identity: any; token: any }) => void
) {
  setSyncInfo({ document: '', identity: '', token: '' });
  return new Promise<string>((resolve, reject) => {
    if (meetingId == '') {
      setSyncInfo({ document: '', identity: '', token: '' });
      reject();
    } else {
      console.log('Got meeting id :', meetingId);
      console.log('backend :', process.env);
      axios
        .post(`${process.env.REACT_APP_BACKEND_BASE_URL}/user/enter-waiting-room`, {
          meeting_id: meetingId,
        })
        .then(res => {
          console.log(res.data);
          setSyncInfo({ document: res.data.document, identity: res.data.identity, token: res.data.token });
          //setName(res.data.identity);
          resolve();
        })
        .catch(reason => {
          setSyncInfo({ document: '', identity: '', token: '' });
          console.error('axios error: ', reason);
          reject();
        });
    }
  });
}

export function extractDocumentData({ documentData }: { documentData: any }) {
  if (documentData.room_id && documentData.room_id !== '') {
    console.log('Got room', documentData.room_id);
    return documentData.room_id;
  } else {
    return null;
  }
}

export function getVideoToken(meetingId: string, roomId: string, identity: string) {
  return new Promise<string>((resolve, reject) => {
    axios
      .post(`${process.env.REACT_APP_BACKEND_BASE_URL}/user/join`, {
        meeting_id: meetingId,
        room_id: roomId,
        identity: identity,
      })
      .then(res => {
        console.log('joined : ', res.data);
        resolve(res.data.token);
      })
      .catch(e => {
        console.error(e);
        reject();
      });
  });
}
