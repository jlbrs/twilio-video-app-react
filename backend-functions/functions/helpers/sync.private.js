exports.Sync = {
  createDocument: function(meeting_id, user_id, user_email, user_name, context) {
    return new Promise((resolve, reject) => {
      console.log("creating", meeting_id, user_email, user_id);
      const client = context.getTwilioClient();
      client.sync.services(context.SYNC_SERVICE_ID)
        .documents
        .create({
          uniqueName: meeting_id,
          data: {
            createdBy: user_email,
            createdByUserId: user_id,
            createdByName: user_name
          }
        })
        .then(resolve)
        .catch(() => {
          resolve(null)
        });
    });
  },

  getRoomDocument: function (meeting_id, context) {
    return new Promise((resolve, reject) => {
      const client = context.getTwilioClient();
      client.sync.services(context.SYNC_SERVICE_ID)
        .documents(meeting_id)
        .fetch()
        .then(resolve)
        .catch(() => {
          resolve(null)
        });
    });
  },

  updateSyncDocument: function (document_sid, new_data, context) {
    return new Promise((resolve, reject) => {
      const client = context.getTwilioClient();
      client.sync.services(context.SYNC_SERVICE_ID)
        .documents(document_sid)
        .update({data: new_data})
        .then(() => {
          resolve(true)
        })
        .catch(() => {
          resolve(false)
        });
    });
  },

  createToken: function(meeting_id, identity, context) {
    let AccessToken = require('twilio').jwt.AccessToken;
    let SyncGrant = AccessToken.SyncGrant;

    // Create a "grant" identifying the Sync service instance for this app.
    let syncGrant = new SyncGrant({
      serviceSid: context.SYNC_SERVICE_ID,
    });
    // Create an access token which we will sign and return to the client,
    // containing the grant we just created and specifying his identity.
    let token = new AccessToken(
      context.ACCOUNT_SID,
      context.TWILIO_API_KEY,
      context.TWILIO_API_SECRET
    );
    token.addGrant(syncGrant);
    token.identity = identity;

    return {
      document: meeting_id,
      identity: identity,
      token: token.toJwt()
    }
  },


  authorizeClient: function (document_sid, identity, context) {
    return new Promise((resolve, reject) => {
      const client = context.getTwilioClient();
      client.sync.services(context.SYNC_SERVICE_ID)
        .documents(document_sid)
        .documentPermissions(identity)
        .update({read: true, write: false, manage: false})
        .then(document_permission => resolve(document_permission))
        .catch(() => {resolve(null)});
    });
  },
  checkClientAuthorization: function (document_sid, identity, context) {
    return new Promise((resolve, reject) => {
      const client = context.getTwilioClient();
      client.sync.services(context.SYNC_SERVICE_ID)
        .documents(document_sid)
        .documentPermissions(identity)
        .fetch()
        .then(document_permission => {
          if(!document_permission) resolve(false);
          resolve(document_permission.read);
        })
        .catch(() => {resolve(false)});
    });
  }
};
