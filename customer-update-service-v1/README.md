# Customer Update Service Version 1.1

ICF-609 - Send customer updates from all Source Systems to ICF Master Service

# Customer Update Service Version 2
ICF-998 - Send customer subscribe/unsubscribe publish from marketing system api to customer-Master api
ICF-2098 - Send customer create/update/delete sync publish from customer-Master system to ICM on-prem api

This service receives message from a pub-sub topic named "customers.updates".

For each meesage received, it calls the ICM Master APIs to send updates.

This sevice host the following POST API onto which the pub-sub will PUSH the messages-

POST https://customer-update-service-dot-xyz-customerintegrations-test.appspot.com/pubsub/customers-updates/push
  
 Below are the steps defined to setup this service for execution.

### Deploy customer-update-service-v1 in App Engine.

```
npm install
gcloud app deploy app.global-customer-update-service-v1-test.yaml --version v1 --quiet
```

### Create the Cloud Pub/Sub topic:

```
gcloud pubsub topics create customers.updates
```

### Create the Subscription on Cloud Pub/Sub topic:

```
gcloud pubsub subscriptions create customer-update-service-v1 --topic=customers.updates --topic-project=xyz-customerintegrations-test --ack-deadline=60 --expiration-period=never --message-retention-duration=7d
```

### Set the URL of Customer-Udpate-Service in PUSH Subscription on Cloud Pub/Sub topic:

```
gcloud pubsub subscriptions modify-push-config customer-update-service-v1 --push-endpoint=https://customer-update-service-dot-xyz-customerintegrations-test.appspot.com/pubsub/customers-updates/push
```

To test the service, perform folllwing step.

### Send a message to Pub Sub Topic and test the app engine service

```
gcloud pubsub topics publish customers.updates \
--attribute \
retailUnit=gb,\
partyUId=B5D394B9-6B62-11e9-8214-005056B12CB9,\
operation=partialUpdate \
--message \
"{ \"update\": { \"partialUpdateMeta\": { \"consumer\": \"IPOS\", \"operationMeta\": \"ADDRESS\" }, \"customer\": { \"updated\": \"2019-05-24T09:46:53.166Z\", \"partyUId\" : \"B5D394B9-6B62-11e9-8214-005056B12CB9\", \"addresses\": [ { \"contextType\": \"HOME_GRP1\", \"city\": \"Wimbeldon\", \"postalCode\": \"LS18 4AB\", \"country\": \"GB\", \"streetAddress1\": \"test 1201, FLOOR 9\", \"updated\": \"2019-05-24T09:46:53.166Z\" } ] } } }"
<<<<<<< HEAD
````
### Send Customer Create/Update/Delete/subscribe/unsubscribe publish message to Pub Sub Topic and test the app engine service
````
gcloud pubsub topics publish customers.updates \
--attribute \
retailUnit=ca,\
partyUId=AA096BE1-B4E7-11e9-AABC-00505699397A,\
operation=create, \
sourceSystem=icmc, \
targetSystem=icm \
--message \
./test/payload_samples/api-pubsub-cm-create-customer-sample.json ||
./test/payload_samples/api-pubsub-cm-update-customer-sample.json ||
./test/payload_samples/api-pubsub-cm-subscribe-customer-sample.json ||
./test/payload_samples/api-pubsub-cm-unsubscribe-customer-sample.json ||
./test/payload_samples/api-pubsub-cm-delete-customer-sample.json
````
=======
```
>>>>>>> 197242066f80619519f8336521af28e0d637c54f
