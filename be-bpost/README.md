# be-bpost

ICF-115. Customer in Belgium can opt for a paid service with Belgium post, which give the possibility to update the address also with the retailers.

In this case customer has explicity given the consent by providing the xyz Family Number in Belgium post portal.

### How the process flows:

1. An App Engine Cron job runs at defined interval, and it call the API to trigger the process. API = GET /ftp-files/process
2. Secrets are loaded in Secret Manager and extracted.
3. Getting files from FTP
   1. Connect to FTP
   2. Download files from FTP to Google Bucket in Downloaded folder.
   3. Delete the downlaoded files from FTP.
4. Start processing each file downloaded in Google Bucket.
   1. Make a copy into Backup folder in Bucket
   2. Get the TOKEN to call ICM APIs.
      1. If getting token fails, abort proessing current file.
   3. Read and Parse the CSV file.
   4. For each record in CSV, do the following-
      1. Get UID based on loyality card number.
      2. Create ICM request message.
      3. Send message to Pub Sub Topic (customers.updates)
      4. If there is any erorr in this, then write the current record to error array.
   5. If there are any error records in error array, then create an error file and write in error folder in Bucket.
   6. Delete CSV file from the Google Bucket.

File from BPost is expected to have Loyalty Numbers which are 19 digit strings that starts with 627598

### Low Level Design

https://confluence.build.xyz.xyz.com/display/INTGR/BE-BPOST+low+level+design+details

### Deployment:

The solution requires a storage account. The creation and configuration of this is automated using Deployment manager.

Command to create/install all GCP components (in DEV)

```shell
gcloud deployment-manager deployments create be-bpost --config ./deployment/resources-dev.yaml --labels env=dev,product=be-bpost
```

Command to remove/delete all GCP components (in DEV)

```shell
gcloud deployment-manager deployments delete be-bpost
```

Please only use Deployment Manager scripts to create/configure GCP components. Do not use the GCP Portal!

### How to replay a file:

Files can be replyaed. Use followig steps-

1. Go to Google Bucket and move from Backup or Error folder to Downloaded folder.
2. Go to App Engine Cron Jobs page, and select the Cron Job "/ftp-files/process".
3. Click on "Run Now" button to start the cron job.

### Cron Job

There is a cron job setup which call the API daily at 0400 hours.
API = GET /ftp-files/process and Service=be-bpost

### Commands

Command to deploy app engine

```shell
gcloud app deploy app.be-bpost-test.yaml --version=v1 --quiet
```

Command to deploy cron job

```shell
gcloud app deploy cron.yaml
```

Command to encrypt secrets

```shell
MY_SECRET_1=super-secret-api-url-test123

echo -n $MY_SECRET_1 | gcloud kms encrypt --plaintext-file=- --ciphertext-file=- --location=global --keyring=icf-customintegrations-secrets  --key=integration-secrets | base64
```

Command to decrypt secrets

```shell
MY_SECRET_3=CiQAoHgKKlXbSK8tl9xmqM0oqKAB0XXaLEhe3LU08wuvufC/kMsSRQATFQ5y1R4tUoZU6uLlAsecl9ql/mmj6d+jVlo7y1zdhYiAanPDWEIpEMrNz3WkOxrAPhHaWjZ+8rpy3Q0Fr25Z0a8VNg==

echo -n $MY_SECRET_3 | base64 --decode | gcloud kms decrypt --plaintext-file=- --ciphertext-file=- --location=global --keyring=icf-customintegrations-secrets  --key=integration-secrets
```

MY_SECRET_3=CiQAoHgKKlXbSK8tl9xmqM0oqKAB0XXaLEhe3LU08wuvufC/kMsSRQATFQ5y1R4tUoZU6uLlAsecl9ql/mmj6d+jVlo7y1zdhYiAanPDWEIpEMrNz3WkOxrAPhHaWjZ+8rpy3Q0Fr25Z0a8VNg==

### Deployment time activities

Change following keys in app.be-bpost-test.yaml

1. NODE_ENV
2. PROJECT_ID
3. FTP_HOST
4. FTP_USER
5. TOKEN_URL
6. FIND_URL
7. FIND_CLIENTID
8. FIND_AUDIENCE
9. Encrypt FTP_PASSWORD and set in FTP_PASSWORD_SECURE
10. Encrypt FIND_CLIENTSECRET and set in FIND_CLIENTSECRET_SECURE
11. Also, change the frequency of cron job in cron.yaml
12. Cloud Build service account has to be given roles to deploy Cron jobs. (Cloud Run, Cloud Scheduler, Cloud App Engine)
