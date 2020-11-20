const Sync = require(Runtime.getFunctions()['helpers/sync'].path).Sync;
const Video = require(Runtime.getFunctions()['helpers/video'].path).Video;
const SSO = require(Runtime.getFunctions()['helpers/sso'].path).SSO;

exports.handler = async function(context, event, callback) {
    console.log("customer trying to join");

    let response = new Twilio.Response();
    response.appendHeader('Content-Type', 'application/json');
    response.setHeaders({"Access-Control-Allow-Origin": "*"}); // For testing from localhost

    const meeting_id = event.meeting_id;
    if(!meeting_id) {
        response.setStatusCode(400);
        response.setBody("Error: Missing meeting_id");

        callback(null, response);
        return;
    }
    const room_id = event.room_id;
    if(!room_id) {
        response.setStatusCode(400);
        response.setBody("Error: Missing room_id");

        callback(null, response);
        return;
    }
    const identity = event.identity;
    if(!identity) {
        response.setStatusCode(400);
        response.setBody("Error: Missing identity");

        callback(null, response);
        return;
    }

    // Check if meeting_id exists:
    console.log("checking if meeting " + meeting_id + " exists and corresponds to room_id " + room_id);
    const document = await Sync.getRoomDocument(meeting_id, context);
    if(!document || !document.data || document.data.room_id !== room_id) {
        response.setStatusCode(404);
        response.setBody("Error: couldn't find your meeting room. Please go to admin and create it first.");

        callback(null, response);
        return;
    }

    // Check if user called get-room before
    console.log("checking if identity has authorization");
    const authorization = await Sync.checkClientAuthorization(document.sid, identity, context);
    if(!authorization) {
        response.setStatusCode(403);
        response.setBody("Error: you have not been authorized.");

        callback(null, response);
        return;
    }

    console.log("Creating an authorization token for the video room");
    response.appendHeader('Content-Type', 'application/json');
    response.setStatusCode(200);
    response.setBody(Video.grantVideoAccess(room_id, identity, context));

    callback(null, response);
};
