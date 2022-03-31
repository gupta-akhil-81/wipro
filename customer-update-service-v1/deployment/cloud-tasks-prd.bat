gcloud config set project xyz-icf-integration-prod

gcloud tasks queues create customer-interactions-q
gcloud tasks queues update customer-interactions-q --max-dispatches-per-second=2 --max-concurrent-dispatches=1
gcloud beta tasks queues update customer-interactions-q --log-sampling-ratio=1.0

gcloud tasks queues create customer-updates-q
gcloud tasks queues update customer-updates-q --max-dispatches-per-second=2 --max-concurrent-dispatches=1
gcloud beta tasks queues update customer-updates-q --log-sampling-ratio=1.0

