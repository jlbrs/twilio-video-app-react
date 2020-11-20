const SSO = require(Runtime.getFunctions()['helpers/sso'].path).SSO;
const Sync = require(Runtime.getFunctions()['helpers/sync'].path).Sync;
const Video = require(Runtime.getFunctions()['helpers/video'].path).Video;

exports.handler = async function(context, event, callback) {
    console.log("admin trying to join");

    let response = new Twilio.Response();
    response.appendHeader('Content-Type', 'application/json');
    response.setHeaders({"Access-Control-Allow-Origin": "*"}); // For testing from localhost

    const token = event.token;
    console.log("Token provided, checking with Google");
    const {is_admin, name, user_id} = await SSO.checkAccess(token, null, context);
    if(!is_admin) {
        response.setStatusCode(403);
        response.setBody("Unauthorized");

        callback(null, response);
        return;
    }

    const identity = name ? name: user_id;

    // Get meeting id from parameters:
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

    const {is_admin: is_owner} = await SSO.checkAccess(token, document.data.createdByUserId, context);
    if(!is_owner) {
        response.setStatusCode(403);
        response.setBody("Unauthorized - not your meeting");

        callback(null, response);
        return;
    }


    // Check if room is opened already:
    console.log("checking if video room is already opened");
    let room_id = document.data.room_id;
    if(!room_id) {
        console.log("No room yet, creating one");
        let room = await Video.createVideoRoom(meeting_id, context.VIDEO_ENABLE_RECORDING, context);
        if(!room || !room.sid) {
            response.setStatusCode(500);
            response.setBody("Error: couldn't create the room");

            callback(null, response);
            return;
        }
        room_id = room.sid;

        let new_data = document.data;
        new_data['room_id'] = room_id;
        console.log('publishing room_id created: ', room_id);
        let result = await Sync.updateSyncDocument(document.sid, new_data, context);
        if(!result) {
            response.setStatusCode(500);
            response.setBody("Error: couldn't publish the new room");

            callback(null, response);
            return;
        }
    }
    console.log('room_id: ', room_id);

    let video_params = null;
    if(room_id) {
        console.log("Creating an authorization token for the video room");
        video_params = Video.grantVideoAccess(room_id, identity, context);
    }

    response.appendHeader('Content-Type', 'application/json');
    response.setStatusCode(200);
    response.setBody({video_params: video_params});
    callback(null, response);
};
