
exports.login = (req, res) =>{
	let payload = req.body;
	let emailId = payload.emailId;
	let userName = payload.userName;
	let role = payload.role;

	if("Test" == userName && "test@timeinc.com" == emailId && "admin" == role)
		res.send(true);
	else
		res.send(false);

}