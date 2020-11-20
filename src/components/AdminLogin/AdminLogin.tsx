import { GoogleLoginResponse } from 'react-google-login';
import React, { useEffect, useState } from 'react';

export default function AdminLogin() {
  const [googleUser, setGoogleUser] = useState<GoogleLoginResponse | null>(null);
  const [name, setName] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');

  useEffect(() => {
    if (googleUser) {
      setName(googleUser.profileObj.name);
      setTokenId(googleUser.tokenId);
    } else {
      setName('');
      setTokenId('');
    }
  }, [googleUser]);

  return { googleUser, setGoogleUser, name, tokenId };
}
