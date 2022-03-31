gcloud config set project xyz-icf-integration-dev
gcloud tasks queues create customer-updates-queue
gcloud tasks queues update customer-updates-queue --max-dispatches-per-second=2 --max-concurrent-dispatches=1
gcloud beta tasks queues update customer-updates-queue --log-sampling-ratio=1.0

#TEST ENV
#gcloud config set project xyz-icf-integration-test
gcloud tasks queues create customer-updates-queue
gcloud tasks queues update customer-updates-queue --max-dispatches-per-second=2 --max-concurrent-dispatches=1
gcloud beta tasks queues update customer-updates-queue --log-sampling-ratio=1.0

#STAGE ENV
#gcloud config set project xyz-icf-integration-stage
gcloud tasks queues create customer-updates-queue
gcloud tasks queues update customer-updates-queue --max-dispatches-per-second=2 --max-concurrent-dispatches=1
gcloud beta tasks queues update customer-updates-queue --log-sampling-ratio=1.0

#PROD ENV
#gcloud config set project xyz-icf-integration-prod
gcloud tasks queues create customer-updates-queue
gcloud tasks queues update customer-updates-queue --max-dispatches-per-second=2 --max-concurrent-dispatches=1
gcloud beta tasks queues update customer-updates-queue --log-sampling-ratio=1.0


