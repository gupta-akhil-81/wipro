const { auth } = require("google-auth-library");
const logging = require("./logging");
const PUBSUB_VERIFICATION_TOKEN = process.env.PUBSUB_VERIFICATION_TOKEN;
const PUBSUB_VERIFICATION_ACCOUNT = process.env.PUBSUB_VERIFICATION_ACCOUNT;

module.exports.ValidateAccount = function(accountName) {
  try {
    if (accountName !== PUBSUB_VERIFICATION_ACCOUNT) {
      return false;
    } else {
      return true;
    }
  } catch (err) {
    logging.error("Exception occured in ValidateAccount. Error was:" + err);
    return false;
  }
};

module.exports.ValidateVerificationToken = function(queryToken) {
  try {
    if (queryToken !== PUBSUB_VERIFICATION_TOKEN) {
      return 400;
    } else {
      return 200;
    }
  } catch (err) {
    logging.error(
      "Exception occured in ValidateVerificationToken. Error was:" + err
    );
    return 400;
  }
};

module.exports.ValidateToken = async function(bearer) {
  try {
    const client = await auth.getClient({
      scopes: "https://www.googleapis.com/auth/cloud-platform"
    });

    const token = bearer.match(/Bearer (.*)/)[1];
    const ticket = await client.verifyIdToken({
      idToken: token
    });

    const claim = ticket.getPayload();
    return claim;
  } catch (err) {
    logging.error("error in ValidateToken. Error was:" + err);
    throw err;
  }
};
