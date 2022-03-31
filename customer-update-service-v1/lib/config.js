module.exports = {
  partialUpdate_url: process.env.partialUpdate_url,
  /*icm_onprem_client_secret: process.env.icm_onprem_client_secret, */
  icm_onprem_client_id: process.env.icm_onprem_client_id,
  icm_onprem_apigw_key: process.env.icm_onprem_apigw_key,
  icm_onprem_service_account_name: process.env.icm_onprem_service_account_name,
  /*icm_onprem_service_account_password:
    process.env.icm_onprem_service_account_password, */
  call_customer_api: process.env.call_customer_api,
  bypass_datetime_check: process.env.bypass_datetime_check,
  use_cloud_tasks: process.env.use_cloud_tasks,
  keyRingId: process.env.KEY_RING_ID,
  keyId: process.env.KEY_ID,
  pubsub_subscription: process.env.PUBSUB_SUBSCRIPTION_NAME,
  pubsub_verification_token: process.env.PUBSUB_VERIFICATION_TOKEN,
  pubsub_verification_account: process.env.PUBSUB_VERIFICATION_ACCOUNT,
  cloud_task_queue_name: process.env.CLOUD_TASK_QUEUE_NAME,
  cloud_task_location: process.env.CLOUD_TASK_LOCATION,
  cloud_task_queue: process.env.CLOUD_TASK_QUEUE_NAME,
  token_url: process.env.TOKEN_URL,
  /*
  find_url: process.env.FIND_URL,
  find_grant_type: process.env.FIND_GRANT_TYPE,
  find_clientId_secret: process.env.FIND_CLIENTID,
  find_clientsecret: process.env.FIND_CLIENTSECRET,
  find_audience: process.env.FIND_AUDIENCE,
  */
  projectId: process.env.GOOGLE_CLOUD_PROJECT || "xyz-icf-integration-dev",
  test_kms_value: process.env.TEST_KMS_VALUE,
  /* Udaya Changes Starts for ICF-998 & ICF-2098 */
  icm_api_base_url: process.env.ICM_API_BASE_URL,
  call_icm_customer_api: process.env.CALL_ICM_CUSTOMER_API,
  use_api_customer_cloud_tasks: process.env.USE_API_CUSTOMER_CLOUD_TASKS,
  /* Udaya Changes Ends for ICF-998 & ICF-2098 */
  log_level: process.env.LOG_LEVEL || "info",
  log_environment: process.env.LOG_ENVIRONMENT || "local"
};

module.exports.getBasicAuthString = function() {
  var authStr =
    "Basic " +
    Buffer.from(
      `${this.icm_onprem_service_account_name}:${this.icm_onprem_service_account_password}`
    ).toString("base64");
  return authStr;
};

/*
module.exports.getValue = function(valueToGet) {
  if (process.env[valueToGet]) {
    return process.env[valueToGet];
  } else {
    logging.warn(
      `Get config value ${valueToGet} failed. No value found in Process.Env`
    );
    throw "Bad config value";
  }
};
*/
