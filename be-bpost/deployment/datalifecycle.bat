REM Storage bucket files
REM gcloud config set project xyz-icf-integration-dev
REM gsutil retention  set 5d gs://be-bpost-xyz-icf-integration-dev

REM gcloud config set project xyz-icf-integration-test
REM gsutil retention  set 5d gs://be-bpost-xyz-icf-integration-test

REM gcloud config set project xyz-icf-integration-stage
REM gsutil retention  set 30d gs://be-bpost-xyz-icf-integration-stage

REM gcloud config set project xyz-icf-integration-prod
REM gsutil retention  set 30d gs://be-bpost-xyz-icf-integration-prod

REM BigQuery tables/views (log sinks etc)
REM gcloud config set project xyz-icf-integration-dev
REM bq mk --transfer_config --headless=true --target_dataset=BE_BPost --display_name=BE_BPost_CLEAN_UP --schedule='every 24 hours' --project_id="xyz-icf-integration-dev" --use_legacy_sql=false --params='{"query":"DELETE FROM `xyz-icf-integration-dev.BE_BPost.winston_log` WHERE DATE(timestamp) <= DATE_SUB (CURRENT_DATE(), INTERVAL 10 DAY);"}' --data_source=scheduled_query --service_account_name="xyz-icf-integration-dev@appspot.gserviceaccount.com"

REM gcloud config set project xyz-icf-integration-test
REM bq mk --transfer_config --headless=true --target_dataset=BE_BPost --display_name=BE_BPost_CLEAN_UP --schedule='every 24 hours' --project_id="xyz-icf-integration-test" --use_legacy_sql=false --params='{"query":"DELETE FROM `xyz-icf-integration-test.BE_BPost.winston_log` WHERE DATE(timestamp) <= DATE_SUB (CURRENT_DATE(), INTERVAL 10 DAY)"}' --data_source=scheduled_query --service_account_name="xyz-icf-integration-test@appspot.gserviceaccount.com"

REM gcloud config set project xyz-icf-integration-stage
REM bq mk --transfer_config --headless=true --target_dataset=BE_BPost --display_name=BE_BPost_CLEAN_UP --schedule='every 24 hours' --project_id="xyz-icf-integration-stage" --use_legacy_sql=false --params='{"query":"DELETE FROM `xyz-icf-integration-stage.BE_BPost.winston_log` WHERE DATE(timestamp) <= DATE_SUB (CURRENT_DATE(), INTERVAL 90 DAY)"}' --data_source=scheduled_query --service_account_name="xyz-icf-integration-stage@appspot.gserviceaccount.com"

REM gcloud config set project xyz-icf-integration-prod
REM bq mk --transfer_config --headless=true --target_dataset=BE_BPost --display_name=BE_BPost_CLEAN_UP --schedule='every 24 hours' --project_id="xyz-icf-integration-prod" --use_legacy_sql=false --params='{"query":"DELETE FROM `xyz-icf-integration-prod.BE_BPost.winston_log` WHERE DATE(timestamp) <= DATE_SUB (CURRENT_DATE(), INTERVAL 90 DAY)"}' --data_source=scheduled_query --service_account_name="xyz-icf-integration-prod@appspot.gserviceaccount.com"

