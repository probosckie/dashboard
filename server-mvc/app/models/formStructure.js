let insertSchema = {
	TableName: "formStructure",
	Item: {
	
	}
};


let selectSchema = {
	TableName: "formStructure"
};


let findMaxFormId = {
  TableName: "formStructure",
  ProjectionExpression: "formId",
  ScanIndexForward:false
};

let deleteSchema = {
    TableName:"formStructure",
    Key:{
        
    },
    UpdateExpression: "set archived = :a",
    ExpressionAttributeValues: {
        
    },
    ReturnValues:"UPDATED_NEW"
};




module.exports = {
	insertSchema:insertSchema,
	selectSchema:selectSchema,
	findMaxFormId:findMaxFormId,
	deleteSchema:deleteSchema
};