let insertSchema = {
	TableName: "formDataRecurring",
	Item: {
	
	}
};


let selectSchema = {
	TableName: "formDataRecurring"
};

let updateSchema = {
    TableName:"formDataRecurring",
    Key:{
        
    },
    UpdateExpression: "set fData = :a",
    ExpressionAttributeValues: {
        
    },
    ReturnValues:"UPDATED_NEW"
};



module.exports = {
	insertSchema:insertSchema,
	selectSchema:selectSchema,
	updateSchema:updateSchema
};