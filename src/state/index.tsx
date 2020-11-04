import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { RoomType } from '../types';
import { TwilioError } from 'twilio-video';
import { settingsReducer, initialSettings, Settings, SettingsAction } from './settings/settingsReducer';
import useFirebaseAuth from './useFirebaseAuth/useFirebaseAuth';
import usePasscodeAuth from './usePasscodeAuth/usePasscodeAuth';
import { User } from 'firebase';
import axios from 'axios';
import { checkMeetingId, extractDocumentData } from '../helpers/room-helpers';
import Voice from 'twilio/lib/rest/Voice';
import { SyncClient } from 'twilio-sync';

export interface StateContextType {
  error: TwilioError | null;
  setError(error: TwilioError | null): void;
  getToken(name: string, room: string, passcode?: string): Promise<string>;
  user?: User | null | { displayName: undefined; photoURL: undefined; passcode?: string };
  signIn?(passcode?: string): Promise<void>;
  signOut?(): Promise<void>;
  isAuthReady?: boolean;
  isFetching: boolean;
  activeSinkId: string;
  setActiveSinkId(sinkId: string): void;
  settings: Settings;
  dispatchSetting: React.Dispatch<SettingsAction>;
  roomType?: RoomType;
  meetingId: string;
  roomId: string;
  setMeetingId(meetingId: string): void;
  getRoom(meetingId: string, room: string, passcode?: string): Promise<string>;
}

export const StateContext = createContext<StateContextType>(null!);

/*
  The 'react-hooks/rules-of-hooks' linting rules prevent React Hooks fron being called
  inside of if() statements. This is because hooks must always be called in the same order
  every time a component is rendered. The 'react-hooks/rules-of-hooks' rule is disabled below
  because the "if (process.env.REACT_APP_SET_AUTH === 'firebase')" statements are evaluated
  at build time (not runtime). If the statement evaluates to false, then the code is not
  included in the bundle that is produced (due to tree-shaking). Thus, in this instance, it
  is ok to call hooks inside if() statements.
*/
export default function AppStateProvider(props: React.PropsWithChildren<{}>) {
  const [error, setError] = useState<TwilioError | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [activeSinkId, setActiveSinkId] = useState('default');
  const [settings, dispatchSetting] = useReducer(settingsReducer, initialSettings);
  const [meetingId, setMeetingId] = useState<string>('');
  const [syncInfo, setSyncInfo] = useState({ document: '', identity: '', token: '' });
  const [roomId, setRoomId] = useState<string>('');

  let contextValue = {
    error,
    setError,
    isFetching,
    activeSinkId,
    setActiveSinkId,
    settings,
    dispatchSetting,
    meetingId,
    setMeetingId,
    roomId,
  } as StateContextType;

  if (process.env.REACT_APP_SET_AUTH === 'firebase') {
    contextValue = {
      ...contextValue,
      ...useFirebaseAuth(), // eslint-disable-line react-hooks/rules-of-hooks
    };
  } else if (process.env.REACT_APP_SET_AUTH === 'passcode') {
    contextValue = {
      ...contextValue,
      ...usePasscodeAuth(), // eslint-disable-line react-hooks/rules-of-hooks
    };
  } else {
    contextValue = {
      ...contextValue,
      getToken: async (identity, roomName) => {
        console.log(meetingId, roomName, identity);
        return axios
          .post(`${process.env.REACT_APP_BACKEND_BASE_URL}/user/join`, {
            meeting_id: meetingId,
            room_id: roomName,
            identity: identity,
          })
          .then(res => {
            console.log(res.data);
            return res.data.token;
          });
      },
    };
  }

  const getToken: StateContextType['getToken'] = (name, room) => {
    setIsFetching(true);
    return contextValue
      .getToken(name, room)
      .then(res => {
        setIsFetching(false);
        return res;
      })
      .catch(err => {
        setError(err);
        setIsFetching(false);
        return Promise.reject(err);
      });
  };

  useEffect(() => {
    if (meetingId == '') return;
    if (!window.location.origin.includes('twil.io')) {
      window.history.replaceState(null, '', window.encodeURI(`/meeting/${meetingId}${window.location.search || ''}`));
    }
    checkMeetingId(meetingId, setSyncInfo)
      .then(() => {
        console.log('room ok');
      })
      .catch(e => {
        console.error(e);
        // @ts-ignore
        setError(e);
        setMeetingId('');
      });
  }, [meetingId]);

  useEffect(() => {
    if (syncInfo.document !== '' && syncInfo.token !== '' && syncInfo.identity !== '') {
      let syncClient = new SyncClient(syncInfo.token);
      syncClient
        .document(syncInfo.document)
        .then(syncDocument => {
          console.log(syncDocument);
          setRoomId(extractDocumentData({ documentData: syncDocument.value }));
          syncDocument.on('updated', function(event) {
            setRoomId(extractDocumentData({ documentData: event.value }));
          });
        })
        .catch(function(error) {
          // @ts-ignore
          setMediaError('Sorry, an error has occurred while connecting to the conferencing system. Please try again.');
          console.error('Unexpected error', error);
        });
    }
  }, [syncInfo]);

  return <StateContext.Provider value={{ ...contextValue, getToken }}>{props.children}</StateContext.Provider>;
}

export function useAppState() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useAppState must be used within the AppStateProvider');
  }
  return context;
}
