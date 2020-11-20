const SSO = require(Runtime.getFunctions()['helpers/sso'].path).SSO;
const Sync = require(Runtime.getFunctions()['helpers/sync'].path).Sync;


exports.handler = async function(context, event, callback) {
    console.log("admin trying to create a meeting");
    let response = new Twilio.Response();
    response.appendHeader('Content-Type', 'application/json');
    response.setHeaders({"Access-Control-Allow-Origin": "*"}); // For testing from localhost

    const {user_id, user_email, is_admin, name: user_name} = await SSO.checkAccess(event.token, null, context);
    if(!is_admin) {
        response.setStatusCode(403);
        response.setBody("Unauthorized");

        callback(null, response);
        return;
    }

    let n_digits = event.n_digits;
    if(!n_digits) n_digits = parseInt(context.MEETING_ID_DIGITS);

    let exists = true;
    let meeting_id = generate_meeting_id(n_digits);

    while (exists) {
        // Check if meeting_id exists:
        console.log("checking if meeting " + meeting_id + " exists");
        const document = await Sync.getRoomDocument(meeting_id, context);
        if(document) {
            meeting_id = generate_meeting_id(n_digits);
        } else {
            break;
        }
    }

    console.log("Meeting ID: ", meeting_id);
    let document = await Sync.createDocument(meeting_id, user_id, user_email, user_name, context);
    if(!document) {
        response.setStatusCode(500);
        response.setBody("Error: couldn't create the new meeting");

        callback(null, response);
        return;
    }
    console.log(document);

    response.appendHeader('Content-Type', 'application/json');
    response.setStatusCode(200);
    response.setBody({meeting_id: meeting_id});

    callback(null, response);
};


function generate_meeting_id(n_digits) {
    const min = 0;
    const max = Math.pow(10, n_digits);
    //The maximum is exclusive and the minimum is inclusive
    const id = Math.floor(Math.random() * (max - min)) + min;

    const str1 = id.toString();
    return str1.padStart(n_digits, str1);
}

