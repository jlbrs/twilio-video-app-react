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

  const [mediaError, setMediaError] = useState<Error>();

  useEffect(() => {
    if (URLMeetingId) {
      setMeetingId(URLMeetingId);
      if (user?.displayName) {
        setStep(Steps.deviceSelectionStep);
      }
    }
  }, [user, URLMeetingId]);

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
    setStep(Steps.deviceSelectionStep);
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
