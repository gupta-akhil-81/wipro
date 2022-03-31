const { PubSub } = require("@google-cloud/pubsub");
const logging = require("./logging");


module.exports.listTopicSubscriptions = async function(topicName) {
  try {
    // Creates a client
    const pubsub = new PubSub();
    // Lists all subscriptions for the topic
    const [subscriptions] = await pubsub.topic(topicName).getSubscriptions();
    return subscriptions;
  } catch (error) {
    logging.err(error);
    throw(error);
    }
};


module.exports.getSubscription = async function getSubscription(subscriptionName) {
    // Imports the Google Cloud client library
    const {PubSub} = require('@google-cloud/pubsub');
      // Creates a client
    const pubsub = new PubSub();
  
    // Gets the metadata for the subscription
    const [metadata] = await pubsub.subscription(subscriptionName).getMetadata();
    /*
    console.log(`Subscription: ${metadata.name}`);
    console.log(`Topic: ${metadata.topic}`);
    console.log(`Push config: ${metadata.pushConfig.pushEndpoint}`);
    console.log(`Ack deadline: ${metadata.ackDeadlineSeconds}s`);
    */
   
    return metadata;
  }