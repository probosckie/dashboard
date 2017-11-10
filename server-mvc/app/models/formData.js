let insertSchema = {
	TableName: "formData",
	Item: {
	
	}
};


let selectSchema = {
	TableName: "formData"
};

let updateSchema = {
    TableName:"formData",
    Key:{
        
    },
    UpdateExpression: "set fData = :a",
    ExpressionAttributeValues:{
        
    },
    ReturnValues:"UPDATED_NEW"
};



module.exports = {
	insertSchema:insertSchema,
	selectSchema:selectSchema,
	updateSchema:updateSchema
};