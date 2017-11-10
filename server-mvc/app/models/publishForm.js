let insertSchema = {
	TableName: "publishForm",
	Item: {
	
	}
};


let selectSchema = {
	TableName: "publishForm"
};

let updateSchema = {
    TableName:"publishForm",
    Key:{
        
    },
    UpdateExpression: "set isCsv = :a, publishDate = :b, expiry = :c, approval = :d, empArray = :e",
    ExpressionAttributeValues:{
        
    },
    ReturnValues:"UPDATED_NEW"
};



module.exports = {
	insertSchema:insertSchema,
	selectSchema:selectSchema,
	updateSchema:updateSchema
};