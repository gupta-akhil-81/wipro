gcloud config set project xyz-icf-integration-dev
gcloud beta secrets create be-bpost-find-clientid --replication-policy="automatic" --labels env=dev,product=be-bpost
gcloud beta secrets create be-bpost-ftp-password --replication-policy="automatic" --labels env=dev,product=be-bpost
gcloud beta secrets create be-bpost-bpost-private-key --replication-policy="automatic" --labels env=dev,product=be-bpost
gcloud beta secrets create be-bpost-bpost-passphrase --replication-policy="automatic" --labels env=dev,product=be-bpost
gcloud beta secrets create be-bpost-find-token-clientid --replication-policy="automatic" --labels env=dev,product=be-bpost
gcloud beta secrets create be-bpost-find-token-clientsecret --replication-policy="automatic" --labels env=dev,product=be-bpost
gcloud deployment-manager deployments create be-bpost --config ./deployment/resources-dev.yaml --labels env=dev,product=be-bpost
gcloud deployment-manager deployments delete be-bpost

#TEST ENV
#gcloud config set project xyz-icf-integration-test
#gcloud beta secrets create be-bpost-find-clientid --replication-policy="automatic" --labels env=test,product=be-bpost
#gcloud beta secrets create be-bpost-ftp-password --replication-policy="automatic" --labels env=test,product=be-bpost
#gcloud beta secrets create be-bpost-bpost-private-key --replication-policy="automatic" --labels env=test,product=be-bpost
#gcloud beta secrets create be-bpost-bpost-passphrase --replication-policy="automatic" --labels env=test,product=be-bpost
#gcloud beta secrets create be-bpost-find-token-clientid --replication-policy="automatic" --labels env=test,product=be-bpost
#gcloud beta secrets create be-bpost-find-token-clientsecret --replication-policy="automatic" --labels env=test,product=be-bpost
#gcloud deployment-manager deployments create be-bpost --config ./deployment/resources-test.yaml --labels env=test,product=be-bpost
#gcloud deployment-manager deployments delete be-bpost

#STAGE ENV
#gcloud config set project xyz-icf-integration-stage
#gcloud beta secrets create be-bpost-find-clientid --replication-policy="automatic" --labels env=stage,product=be-bpost
#gcloud beta secrets create be-bpost-ftp-password --replication-policy="automatic" --labels env=stage,product=be-bpost
#gcloud beta secrets create be-bpost-bpost-private-key --replication-policy="automatic" --labels env=stage,product=be-bpost
#gcloud beta secrets create be-bpost-bpost-passphrase --replication-policy="automatic" --labels env=stage,product=be-bpost
#gcloud beta secrets create be-bpost-find-token-clientid --replication-policy="automatic" --labels env=stage,product=be-bpost
#gcloud beta secrets create be-bpost-find-token-clientsecret --replication-policy="automatic" --labels env=stage,product=be-bpost
#gcloud deployment-manager deployments create be-bpost --config ./deployment/resources-stage.yaml --labels env=stage,product=be-bpost
#gcloud deployment-manager deployments delete be-bpost

#PROD ENV
#gcloud config set project xyz-icf-integration-prod
#gcloud beta secrets create be-bpost-find-clientid --replication-policy="automatic" --labels env=prod,product=be-bpost
#gcloud beta secrets create be-bpost-ftp-password --replication-policy="automatic" --labels env=prod,product=be-bpost
#gcloud beta secrets create be-bpost-bpost-private-key --replication-policy="automatic" --labels env=prod,product=be-bpost
#gcloud beta secrets create be-bpost-bpost-passphrase --replication-policy="automatic" --labels env=prod,product=be-bpost
#gcloud beta secrets create be-bpost-find-token-clientid --replication-policy="automatic" --labels env=prod,product=be-bpost
#gcloud beta secrets create be-bpost-find-token-clientsecret --replication-policy="automatic" --labels env=prod,product=be-bpost
#gcloud deployment-manager deployments create be-bpost --config ./deployment/resources-prod.yaml --labels env=prod,product=be-bpost
#gcloud deployment-manager deployments delete be-bpost