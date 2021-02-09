import axios from 'axios';
import { useAppState } from '../state';

export function checkMeetingId(
  meetingId: string,
  setSyncInfo: (arg0: { document: string; identity: string; token: string; is_admin: boolean }) => void,
  tokenId: string
) {
  return new Promise<string>((resolve, reject) => {
    if (!meetingId) {
      setSyncInfo({ document: '', identity: '', token: '', is_admin: false });
      reject();
    } else {
      console.log('2. Got meeting id: ', meetingId, ', checking if it exists...');
      axios
        .post(`${process.env.REACT_APP_BACKEND_BASE_URL}/user/enter-waiting-room`, {
          meeting_id: meetingId,
          token: tokenId,
        })
        .then(res => {
          console.log('3. Meeting id accepted, updating SyncInfo with data: ', res.data);
          setSyncInfo({
            document: res.data.document,
            identity: res.data.identity,
            token: res.data.token,
            is_admin: res.data.is_admin,
          });
          resolve();
        })
        .catch(reason => {
          setSyncInfo({ document: '', identity: '', token: '', is_admin: false });
          console.error('axios error: ', reason);
          reject();
        });
    }
  });
}

export function extractDocumentData({ documentData }: { documentData: any }) {
  if (documentData.room_id && documentData.room_id !== '') {
    return documentData.room_id;
  } else {
    return null;
  }
}

export function getVideoToken(meetingId: string, roomId: string, identity: string, tokenId?: string) {
  return new Promise<string>((resolve, reject) => {
    if (tokenId) {
      console.log('7. Trying to connect to room: ', roomId, ' as an admin.');
      axios
        .post(`${process.env.REACT_APP_BACKEND_BASE_URL}/admin/join`, {
          meeting_id: meetingId,
          token: tokenId,
        })
        .then(res => {
          console.log('8. Joined : ', res.data.video_params);
          resolve(res.data.video_params.token);
        })
        .catch(e => {
          console.error(e);
          reject();
        });
    } else {
      console.log('7. Trying to connect to room: ', roomId, ' as a participant.');
      axios
        .post(`${process.env.REACT_APP_BACKEND_BASE_URL}/user/join`, {
          meeting_id: meetingId,
          room_id: roomId,
          identity: identity,
        })
        .then(res => {
          console.log('8. Joined : ', res.data);
          resolve(res.data.token);
        })
        .catch(e => {
          console.error(e);
          reject();
        });
    }
  });
}
