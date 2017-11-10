let insertSchema = {
	TableName: "publishFormRecurring",
	Item: {
	
	}
};


let selectSchema = {
	TableName: "publishFormRecurring"
};

let findMaxFormId = {
  TableName: "publishFormRecurring",
  ProjectionExpression: "publishId",
  ScanIndexForward:false
};



module.exports = {
	insertSchema:insertSchema,
	selectSchema:selectSchema,
	findMaxFormId:findMaxFormId
};