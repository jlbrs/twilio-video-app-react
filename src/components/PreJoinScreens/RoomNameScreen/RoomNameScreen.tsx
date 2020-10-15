import React, { ChangeEvent, FormEvent } from 'react';
import {
  Typography,
  makeStyles,
  TextField,
  Grid,
  Button,
  InputLabel,
  Theme,
  CircularProgress,
} from '@material-ui/core';
import { useAppState } from '../../../state';

const useStyles = makeStyles((theme: Theme) => ({
  gutterBottom: {
    marginBottom: '1em',
  },
  inputContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '1.5em 0 3.5em',
    '& div:not(:last-child)': {
      marginRight: '1em',
    },
    [theme.breakpoints.down('sm')]: {
      margin: '1.5em 0 2em',
    },
  },
  textFieldContainer: {
    width: '100%',
  },
  continueButton: {
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
}));

interface RoomNameScreenProps {
  name: string;
  roomName: string;
  setName: (name: string) => void;
  setRoomName: (roomName: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function RoomNameScreen({ name, roomName, setName, setRoomName, handleSubmit }: RoomNameScreenProps) {
  const classes = useStyles();
  const { user, isFetching, meetingId, setMeetingId } = useAppState();

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleMeetingIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMeetingId(event.target.value);
  };

  const handleRoomNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRoomName(event.target.value);
  };

  const hasUsername = !window.location.search.includes('customIdentity=true') && user?.displayName;

  return (
    <>
      <Typography variant="h5" className={classes.gutterBottom}>
        Join a Meeting
      </Typography>
      <Typography variant="body1">
        {roomName ? `Loading meeting ${meetingId}...` : "Enter the id of the meeting you'd like to join"}
      </Typography>
      {!roomName && !isFetching && (
        <form onSubmit={handleSubmit}>
          <div className={classes.inputContainer}>
            <div className={classes.textFieldContainer}>
              <InputLabel shrink htmlFor="input-meeting-id">
                Meeting id
              </InputLabel>
              <TextField
                autoCapitalize="false"
                id="input-meeting-id"
                variant="outlined"
                size="small"
                value={meetingId}
                onChange={handleMeetingIdChange}
              />
            </div>
          </div>
          <Grid container justify="flex-end">
            <Button
              variant="contained"
              type="submit"
              color="primary"
              disabled={!meetingId}
              className={classes.continueButton}
            >
              Continue
            </Button>
          </Grid>
        </form>
      )}
      {(roomName || isFetching) && <CircularProgress />}
    </>
  );
}
