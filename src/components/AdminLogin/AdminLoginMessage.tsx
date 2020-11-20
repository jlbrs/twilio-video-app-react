import { GoogleLogin, GoogleLogout } from 'react-google-login';
import React from 'react';
import { useAppState } from '../../state';

export default function AdminLoginMessage() {
  const { googleUser, setGoogleUser, name } = useAppState();

  const onLoginSuccess = (response: any) => {
    console.log('login success: ', response);
    setGoogleUser(response);
  };

  const onLoginFailure = (response: any) => {
    console.log('login failure: ', response);
    setGoogleUser(null);
  };

  const onLogoutSuccess = () => {
    console.log('logout success');
    setGoogleUser(null);
  };

  const onLogoutFailure = () => {
    console.log('logout failure');
  };
  return (
    <p>
      {googleUser ? `You are connected as ${name}. ` : 'Are you the host? Please '}
      {googleUser ? (
        <GoogleLogout
          clientId={'' + process.env.REACT_APP_GOOGLE_SIGN_IN_CLIENT_ID}
          buttonText="Logout"
          onLogoutSuccess={onLogoutSuccess}
          onFailure={onLogoutFailure}
        />
      ) : (
        <GoogleLogin
          clientId={'' + process.env.REACT_APP_GOOGLE_SIGN_IN_CLIENT_ID}
          buttonText="Login"
          onSuccess={onLoginSuccess}
          onFailure={onLoginFailure}
          cookiePolicy={'single_host_origin'}
          isSignedIn={true}
          hostedDomain={'' + process.env.REACT_APP_GOOGLE_SIGN_IN_GSUITE_DOMAIN}
        />
      )}
    </p>
  );
}
