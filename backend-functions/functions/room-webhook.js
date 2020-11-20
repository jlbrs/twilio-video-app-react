const Sync = require(Runtime.getFunctions()['helpers/sync'].path).Sync;

exports.handler = async function(context, event, callback) {
    console.log("room webhook: " + event.StatusCallbackEvent);
    let response = new Twilio.Response();
    response.appendHeader('Content-Type', 'application/json');
    response.setHeaders({"Access-Control-Allow-Origin": "*"}); // For testing from localhost

    if(event.StatusCallbackEvent !== "room-ended") {
        callback(null, null);
        return;
    }

    const room_id = event.RoomSid;
    const meeting_id = event.RoomName;

    // Check if meeting_id exists:
    console.log("checking if meeting " + meeting_id + " exists and corresponds to room_id " + room_id);
    const document = await Sync.getRoomDocument(meeting_id, context);
    if(!document || !document.data || document.data.room_id !== room_id) {
        response.setStatusCode(404);
        response.setBody("Error: couldn't find your meeting room. Please go to admin and create it first.");

        callback(null, response);
        return;
    }

    console.log('removing room_id ');
    let new_data = document.data;
    delete new_data['room_id'];
    let result = await Sync.updateSyncDocument(document.sid, new_data, context);
    if(!result) {
        response.setStatusCode(500);
        response.setBody("Error: couldn't publish the new room");

        callback(null, response);
        return;
    }
}
