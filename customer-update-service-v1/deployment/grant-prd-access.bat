gcloud config set project xyz-icf-integration-prod
gcloud projects add-iam-policy-binding 664102736546 --member="serviceAccount:627245087595@cloudbuild.gserviceaccount.com"  --role='roles/owner'
#gcloud projects remove-iam-policy-binding 664102736546 --member="serviceAccount:627245087595@cloudbuild.gserviceaccount.com"  --role='roles/owner'