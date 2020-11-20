const uuid = require('uuid');
const Sync = require(Runtime.getFunctions()['helpers/sync'].path).Sync;
const SSO = require(Runtime.getFunctions()['helpers/sso'].path).SSO;

exports.handler = async function(context, event, callback) {
    console.log("customer trying to enter waiting room");

    let response = new Twilio.Response();
    response.appendHeader('Content-Type', 'application/json');
    response.setHeaders({"Access-Control-Allow-Origin": "*"}); // For testing from localhost

    const identity = uuid.v4();
    console.log("user identity: ", identity);

    const meeting_id = event.meeting_id;
    if(!meeting_id) {
        response.setStatusCode(400);
        response.setBody("Error: Missing meeting_id");

        callback(null, response);
        return;
    }

    // Check if meeting_id exists:
    console.log("checking if meeting " + meeting_id + " exists");
    const document = await Sync.getRoomDocument(meeting_id, context);
    if(!document || !document.data) {
        response.setStatusCode(404);
        response.setBody("Error: couldn't find your meeting room. Please go to admin and create it first.");

        callback(null, response);
        return;
    }

    const {is_admin} = await SSO.checkAccess(event.token, document.data.createdByUserId, context);

    console.log("Creating an authorization token for this user");
    const authorization = await Sync.authorizeClient(meeting_id, identity, context);
    if(!authorization) {
        response.setStatusCode(403);
        response.setBody("Error: couldn't authorize your to connect to this room.");

        callback(null, response);
        return;
    }
    response.appendHeader('Content-Type', 'application/json');
    response.setStatusCode(200);
    let r = Sync.createToken(meeting_id, identity, context);
    r.is_admin = is_admin;
    response.setBody(r);
    callback(null, response);
};
