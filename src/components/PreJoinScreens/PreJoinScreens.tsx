import React, { useState, useEffect, FormEvent } from 'react';
import DeviceSelectionScreen from './DeviceSelectionScreen/DeviceSelectionScreen';
import IntroContainer from '../IntroContainer/IntroContainer';
import MediaErrorSnackbar from './MediaErrorSnackbar/MediaErrorSnackbar';
import PreflightTest from './PreflightTest/PreflightTest';
import RoomNameScreen from './RoomNameScreen/RoomNameScreen';
import { useAppState } from '../../state';
import { useParams } from 'react-router-dom';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';
import Video from 'twilio-video';
import axios from 'axios';
import { SyncClient } from 'twilio-sync';

export enum Steps {
  roomNameStep,
  deviceSelectionStep,
}

export default function PreJoinScreens() {
  const { user, meetingId, setMeetingId } = useAppState();
  const { getAudioAndVideoTracks } = useVideoContext();
  const { URLMeetingId } = useParams();
  const [step, setStep] = useState(Steps.roomNameStep);

  const [name, setName] = useState<string>(user?.displayName || '');
  const [roomName, setRoomName] = useState<string>('');
  const [syncInfo, setSyncInfo] = useState({ document: '', identity: '', token: '' });

  const [mediaError, setMediaError] = useState<Error>();

  function extractDocumentData({ documentData }: { documentData: any }) {
    if (documentData.room_id && documentData.room_id !== '') {
      console.log('Got room', documentData.room_id);
      setRoomName(documentData.room_id);
      setStep(Steps.deviceSelectionStep);
    } else {
      setRoomName('');
    }
  }

  useEffect(() => {
    if (URLMeetingId) {
      setMeetingId(URLMeetingId);
      checkMeetingId(URLMeetingId);
      if (user?.displayName) {
        setStep(Steps.roomNameStep);
      }
    }
  }, [user, URLMeetingId]);

  // get connection details for Sync
  function checkMeetingId(meetingId: string) {
    if (meetingId !== '') {
      console.log('Got meeting id :', meetingId);
      axios
        .post(`${process.env.BACKEND_BASE_URL}/user/enter-waiting-room`, {
          meeting_id: meetingId,
        })
        .then(res => {
          console.log(res.data);
          setSyncInfo({ document: res.data.document, identity: res.data.identity, token: res.data.token });
          setName(res.data.identity);
        })
        .catch(reason => {
          setMediaError(reason);
          setSyncInfo({ document: '', identity: '', token: '' });
          console.error(reason);
        });
    } else {
      setSyncInfo({ document: '', identity: '', token: '' });
    }
  }

  // get the sync document (to extract the room id) and subscribe to it
  useEffect(() => {
    if (syncInfo.document !== '' && syncInfo.token !== '' && syncInfo.identity !== '') {
      let syncClient = new SyncClient(syncInfo.token);
      syncClient
        .document(syncInfo.document)
        .then(syncDocument => {
          console.log(syncDocument);
          extractDocumentData({ documentData: syncDocument.value });
          syncDocument.on('updated', function(event) {
            extractDocumentData({ documentData: event.value });
          });
        })
        .catch(function(error) {
          // @ts-ignore
          setMediaError('Sorry, an error has occurred while connecting to the conferencing system. Please try again.');
          console.error('Unexpected error', error);
        });
    } else {
    }
  }, [syncInfo]);

  useEffect(() => {
    if (step === Steps.deviceSelectionStep) {
      getAudioAndVideoTracks().catch(error => {
        console.log('Error acquiring local media:');
        console.dir(error);
        setMediaError(error);
      });
    }
  }, [getAudioAndVideoTracks, step]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // If this app is deployed as a twilio function, don't change the URL because routing isn't supported.
    if (!window.location.origin.includes('twil.io')) {
      window.history.replaceState(null, '', window.encodeURI(`/meeting/${meetingId}${window.location.search || ''}`));
    }
    checkMeetingId(meetingId);
  };

  const SubContent = (
    <>
      {Video.testPreflight && <PreflightTest />}
      <MediaErrorSnackbar error={mediaError} />
    </>
  );

  return (
    <IntroContainer subContent={step === Steps.deviceSelectionStep && SubContent}>
      {step === Steps.roomNameStep && (
        <RoomNameScreen
          name={name}
          roomName={roomName}
          setName={setName}
          setRoomName={setRoomName}
          handleSubmit={handleSubmit}
        />
      )}

      {step === Steps.deviceSelectionStep && (
        <DeviceSelectionScreen name={name} roomName={roomName} setStep={setStep} />
      )}
    </IntroContainer>
  );
}
