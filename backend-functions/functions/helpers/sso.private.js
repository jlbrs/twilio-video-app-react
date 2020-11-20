const {OAuth2Client} = require('google-auth-library');
exports.SSO = {
  checkAccess: async function (token, required_user_id, context) {
    return new Promise((resolve, reject) => {
      let res = {
        user_id: "",
        user_email: "",
        is_admin: false,
        name: ""
      };

      if(!token) {
        resolve(res);
      }

      console.log("Token provided, checking with Google");
      const CLIENT_ID = context.GOOGLE_SIGN_IN_CLIENT_ID;
      const client = new OAuth2Client(CLIENT_ID);
      client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
      }).then((ticket) => {
        return ticket.getPayload();
      }).then((payload) => {
        const user_id = payload['sub'];
        const user_email = payload['email'];
        const name = payload['name'];
        let is_admin = true;
        // If request specified a G Suite domain:
        const required_domain = context.GOOGLE_SIGN_IN_GSUITE_DOMAIN;
        if (required_domain) {
          const domain = payload['hd'];
          is_admin &= (domain === context.GOOGLE_SIGN_IN_GSUITE_DOMAIN);
        }
        if(required_user_id) {
          is_admin &= (user_id === required_user_id);
        }
        resolve({
          user_id: user_id,
          user_email: user_email,
          is_admin: is_admin,
          name: name
        });
      }).catch((error) => {
        console.error(error);
        resolve(res);
      });
    });
  }
};


