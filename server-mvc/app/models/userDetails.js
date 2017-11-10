let insertSchema = {
	TableName: "userDetails",
	Item: {
	
	}
};

let selectSchema = {
	TableName: "userDetails"
};

//empId	email	fullName	managerEmpId	managerName	managerEmail
let fields = ['empId','email','fullName', 'managerEmpId', 'managerName', 'managerEmail','bu'];

/*let findMaxUserId = {
	TableName: "userDetails",
	ProjectionExpression: "userId",
  ScanIndexForward:false
};*/


let updateSchema = {
	TableName: "userDetails",
	Key: {
		
	},
	UpdateExpression: "set email = :a, fullName = :b, managerEmpId = :c, managerName = :d, managerEmail = :e, updatedOn = :f, archiveRoles = :g, updatedBy = :h, bu = :i",
	ExpressionAttributeValues: {
		
	},
	ReturnValues:"UPDATED_NEW"
};



module.exports = {
	insertSchema:insertSchema,
	fields:fields,
	selectSchema:selectSchema,
	updateSchema:updateSchema
}