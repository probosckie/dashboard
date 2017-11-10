let insertSchema = {
	TableName: "userHierarchy",
	
};

let selectSchema = {
	TableName: "userHierarchy"
};

let fields = ["empId","managerEmpId"];


module.exports = {
	insertSchema:insertSchema,
	selectSchema:selectSchema,
	fields:fields
}