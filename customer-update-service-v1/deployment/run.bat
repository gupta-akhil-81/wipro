gcloud config set project xyz-icf-integration-dev
gcloud deployment-manager deployments create customer-updates --config ./deployment/resources-dev.yaml --labels env=dev,product=customer-updates
gcloud deployment-manager deployments delete customer-updates

#TEST ENV
#gcloud config set project xyz-icf-integration-test
#gcloud deployment-manager deployments create customer-updates --config ./deployment/resources-test.yaml --labels env=test,product=customer-updates
#gcloud deployment-manager deployments delete customer-updates

#STAGE ENV
#gcloud config set project xyz-icf-integration-stage
#gcloud deployment-manager deployments create customer-updates --config ./deployment/resources-stage.yaml --labels env=stage,product=customer-updates
#gcloud deployment-manager deployments delete customer-updates

#PROD ENV
#gcloud config set project xyz-icf-integration-prod
#gcloud deployment-manager deployments create customer-updates --config ./deployment/resources-prod.yaml --labels env=prod,product=customer-updates
#gcloud deployment-manager deployments delete customer-updates