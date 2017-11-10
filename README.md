# tii-dashboard
TII performance dashboard.

To install:

1.
download this jar
https://s3.ap-south-1.amazonaws.com/dynamodb-local-mumbai/dynamodb_local_latest.tar.gz

2.
start dynamodb with this command:

java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb

(since we will use this command multiple times, add this to ur windows PATH or mac - bash_profile)


3. install razor sql (for your platform - windows or mac)
http://razorsql.com/download_mac.html


4. configure razor sql with dynamodb process
AWS server: 
localhost:8000?region=sa-east-1


5. clone the repo and in the root folder,

To run locally:
npm i
npm run dev
cd server-mvc
npm i
npm run dev


To start in production
1. goto server-mvc folder -> 
npm i
npm start
2. goto tii-dashboard folder -> 
npm i 
npm start 


To do a fresh start- delete all tables and create them by running /server/app.js > npm start.

To setup email config: enter credentials at ./server-mvc/config/emailConfig.js to start sending mails
