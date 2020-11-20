exports.Video = {
  createVideoRoom:function (room_id, enable_recording, context) {
    return new Promise((resolve, reject) => {
      const client = context.getTwilioClient();
      client.video.rooms
        .create({
          recordParticipantsOnConnect: enable_recording,
          statusCallback: context.VIDEO_WEBHOOK,
          type: context.VIDEO_ROOM_TYPE,
          uniqueName: room_id
        })
        .then(resolve)
        .catch(() => {resolve(null)});
    });
  },

  grantVideoAccess: function (room_id, identity, context) {
    const AccessToken = require('twilio').jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;
    const videoGrant = new VideoGrant({
      room: room_id
    });

    let token = new AccessToken(
      context.ACCOUNT_SID,
      context.TWILIO_API_KEY,
      context.TWILIO_API_SECRET
    );

    token.addGrant(videoGrant, context);
    token.identity = identity;
    return {
      room_id: room_id,
      identity: identity,
      token: token.toJwt()
    };
  }
};
