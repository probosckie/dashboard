
let selectSchema = {
	TableName: "roles"
};


let updateSchema = {
    TableName:"roles",
    Key:{
        
    },
    UpdateExpression: "set roleList = :a",
    ExpressionAttributeValues:{
        
    },
    ReturnValues:"UPDATED_NEW"
};

module.exports = {
	selectSchema:selectSchema,
	updateSchema:updateSchema
};