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
    let result = await Sync.updateSyncDocument(document.sid, {}, context);
    if(!result) {
        response.setStatusCode(500);
        response.setBody("Error: couldn't publish the new room");

        callback(null, response);
        return;
    }
}

const Sync = {
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
};
