const AWS = require('aws-sdk');
var http = require('http');
const environment = process.env.NODE_ENV;

let wrapper;


if(environment === 'prod') {
	wrapper = {
		accessKeyId: "YOURACCESSKEY",
		secretAccessKey: "YOURSECRETKEY",
		region: "us-east-1",
		endpoint: new AWS.Endpoint('http://localhost:8000'),
		httpOptions: {
	    agent: new http.Agent({keepAlive: true})
	  }
	};
} else {
	wrapper = {
	  accessKeyId: "YOURKEY",
	  secretAccessKey: "YOURSECRET",
	  region: "sa-east-1",
	  endpoint: new AWS.Endpoint('http://localhost:8000'),
	  httpOptions: {
	    agent: new http.Agent({keepAlive: true})
	  }
	}
}

AWS.config.update(wrapper);

const docClient = new AWS.DynamoDB.DocumentClient();

module.exports ={
	"docClient":docClient
};
