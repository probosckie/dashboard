const docClient = require('../../config/database').docClient;
const userDetails = require('../models/userDetails');
const userHierarchy = require('../models/userHierarchy');
const publishForm = require('../models/publishForm');
const publishFormRecurring = require('../models/publishFormRecurring');
const formDataRecurring = require('../models/formDataRecurring');
const formStructure = require('../models/formStructure');
const formData = require('../models/formData');
const roles = require('../models/roles');
const async = require('async');
const createdBy = "Prabhas";
const dataCache = require('./dataCache');
const Q = require('q');
const ews = require("ews-javascript-api");
//const credentials = require('../../config/emailConfig.js');
const npmCache = require('memory-cache');

const fs = require('fs');
const path = require('path');
const REPORTS = path.join(__dirname, '../..', 'reports');


/*const testEmail = 'krishna.khanapure@timeinc.com';

const exch = new ews.ExchangeService(ews.ExchangeVersion.Exchange2013);
exch.Credentials = new ews.ExchangeCredentials(credentials.email, credentials.password);
exch.Url = new ews.Uri("https://outlook.office365.com/Ews/Exchange.asmx");*/


let firstTimeStarted = false;

function findEmployeesOf(x) {
  var i,y =[];
  var map = npmCache.get('hierarchyMap');
  //console.log(npmCache.get('hierarchyMap'));

  for (i in map){
     if(map[i] === x) {
        y.push(i);
      }
  }
  return y;
}


function findAllEmpBelowSeed(x) {
  var all = [],temp;
  var empBelow = findEmployeesOf(x);
  if(empBelow.length === 0) {
    return false;
  }

  else {
    all = all.concat(empBelow);
    empBelow.forEach((v,i) => {
      temp = findAllEmpBelowSeed(parseInt(v));
      if(!!temp) {
         all = all.concat(temp);
      }
    });
  }
  return all;
}


function findAllEmpUnderBu(bu) {
	let empArr = [],i;
	let arr = npmCache.get('nestedMap');
	//console.log(npmCache.get('nestedMap'));
	let map = arr[bu];
	map.forEach((v,i) => {
		empArr = empArr.concat(v);
		empArr = empArr.concat(findAllEmpBelowSeed(parseInt(v)));
	});
	return empArr;
}


function summation(nodeArray, aggregateFunc) {
	let fieldSum = Object.keys(aggregateFunc);
	let x, y, buffer = {}, temp;
	for (y=0; y<fieldSum.length;y++) {
		if(fieldSum[y] !== 'approval') {
			buffer[fieldSum[y]] = 0;
			for (x=0; x< nodeArray.length; x++) {
				if(nodeArray[x][fieldSum[y]]) {
					temp = parseInt(nodeArray[x][fieldSum[y]]);
					buffer[fieldSum[y]] = buffer[fieldSum[y]] + (Boolean(temp)?temp:0);
				}
			}
			if(aggregateFunc[fieldSum[y]] === 'average' && x>0) {
				buffer[fieldSum[y]] = buffer[fieldSum[y]] / x;
			}
		}
	}

	return buffer;
}

function immediateManagersUnderBu(node){
	let empArr = [],i;
	let arr = npmCache.get('nestedMap');
	//console.log(npmCache.get('nestedMap'));
	return arr[node]
}

function deepSum(node, formId, combineFunc, isBu) {
	let im;
	if(isBu){
		/*find immediate managers under BU*/
		im = immediateManagersUnderBu(node);

	} else {
	 im = findEmployeesOf(parseInt(node));
	}

	let formDataMap = npmCache.get('formDataMap');
	//console.log(npmCache.get('formDataMap'));
	let temp1;
	if(im.length !== 0) {
		temp1 = im.map(v => deepSum(v, formId, combineFunc, false));
		return summation(temp1, combineFunc);
	} else {
		if(formDataMap[node] && formDataMap[node][formId])
			return formDataMap[node][formId];
		else
			return {};
	}
}

function calculateAllDaysBetween(start,end,interval) {
	let temp = new Date(start), end2 = new Date(end);
	let range = [];
	end2.setHours(0,0,0,0);
	temp.setHours(0,0,0,0);
	if(interval === 'everyday') {
		interval = 1;		
	} else if (interval === 'everyweek'){
		interval = 7;
	} else if (interval === 'monthly'){
		interval = 30;
	} else if (interval === 'quarterly'){
		interval = 90;
	} else if (interval === 'halfYearly'){
		interval = 180
	}

	while(temp <=  end2) {
		range.push((new Date(temp)).toDateString());
		temp.setDate(temp.getDate() + interval)
	}
	return range;
}



exports.x = (req,res) => {
	res.render('index.ejs');
}

exports.getUserData = (req,res) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	Q.all([dataCache.queryUsers()]).then(r => {
		res.send(npmCache.get('userDetails'));
	});
}

exports.getUserHierarchyData = (req,res) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	Q.all([dataCache.getHierarchy()]).then(r => {
		res.send(npmCache.get('userHierarchy'));
	});
}

exports.updateUserData = (req,res) => {
	let updateArray = req.body;
	let asyncTask = [];
	updateArray.forEach((v,i) => {
		asyncTask.push((callback) => {
			let updateSchema = userDetails.updateSchema;
			updateSchema.ExpressionAttributeValues = {
				":a":v.email || ' ',
				":b":v.fullName || ' ',
				":c":v.managerEmpId || ' ',
				":d":v.managerName || ' ',
				":e":v.managerEmail || ' ',
				":f":v.updatedOn || ' ',
				":g":v.archiveRoles || ' ',
				":h":createdBy || ' ',
				":i":v.bu || ' '
			};
			updateSchema.Key = {
				empId:v.empId || ' '
			};
			docClient.update(updateSchema, (err, data) => {
				if(err)
					console.log('error in updating initialData' + JSON.stringify(err));
				else {
					console.log('initial data updated');
					callback();
				}
			});
		});
	});
	async.parallel(asyncTask, function() {
  	console.log('rows updated');
  	npmCache.del('userDetails');
		npmCache.del('employeeMap');
		npmCache.del('allEmpIds');
		npmCache.del('publishForm');
		npmCache.del('userHierarchy');
		npmCache.del('buArray');
		npmCache.del('managerArray');
		npmCache.del('nestedMap');
		npmCache.del('formDataMap');
  	res.send('updated succesfully');
	});
}


exports.getEmployeeMap = (req,res) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	Q.all([dataCache.buildEmployeeMap()]).then((results) => {
		res.send({
			"employeeMap":npmCache.get('employeeMap'),
			"hierarchyMap":npmCache.get('hierarchyMap')
		});
	});
}

exports.getNestedMap = (req,res) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	Q.all([dataCache.buildNestedMap()]).then((results) => {
		res.send(npmCache.get('nestedMap'));
	});
}

exports.publishForm2 = (req,res) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	let payload = req.body, empArray = [], asyncTask = [], temp, params = publishForm.insertSchema, employeeMap, topManagers, target, publishCache, approvalCache, index;
	
	let updateSchema = publishForm.updateSchema;
	let publishDate = payload.publishDate;
	let expiry = payload.expiry;
	let requireApproval = payload.requireApproval;
	let isCsv = payload.isCsv;
	let formId =  parseInt(payload.formId);

	let newCacheObj = {};


	topManagers = npmCache.get('nestedMap');
	employeeMap = npmCache.get('employeeMap');
	

	approvalCache = npmCache.get('approvalCache');
	publishCache = npmCache.get('publishForm');

	if(payload.type === 'everyone') {
		empArray = Object.keys(employeeMap);
	}
	else if (payload.type === 'specific') {
		if(!!payload.isBu){
			payload.nodes.forEach((v,i) => {
				empArray = empArray.concat(findAllEmpUnderBu(v));
			})
		}
		else {
			empArray = payload.nodes || [];
		}

		if(payload.extras.length > 0)
			empArray = empArray.concat(payload.extras.split(','));
	}
	else if (payload.type === 'immediate-child') {
		if(payload.isBu) {
			temp = payload.nodes;
			temp.forEach((v,i) => {
				empArray = empArray.concat(topManagers[v])
			});
		}
		else {
			temp = payload.nodes;
			temp.forEach((v,i) => {
				empArray = empArray.concat(findEmployeesOf(parseInt(v)));
			});
		}
		if(payload.extras.length > 0)
			empArray = empArray.concat(payload.extras.split(','));
	}

	else if (payload.type === 'everyone-below') {
		if(!!payload.isBu){
			payload.nodes.forEach((v,i) => {
				empArray = empArray.concat(findAllEmpUnderBu(v));
			});
		} else {
			payload.nodes.forEach((v,i) => {
				empArray = empArray.concat(findAllEmpBelowSeed(parseInt(v)));
			})
		}
		if(payload.extras.length > 0)
			empArray = empArray.concat(payload.extras.split(','));
	}

	newCacheObj = {
			formId:formId,
			isCsv:isCsv,
			publishDate:publishDate,
			expiry:expiry,
			approval:requireApproval,
			empArray:empArray
	};

	index = publishCache.findIndex(v => v.formId === formId);

	if(index !== -1) {
		//append the audience and update rest of the details
		target = publishCache[index].empArray;
		
		empArray.forEach(v => {
			if (target.indexOf(v) === -1)
				target = target.concat(v);
		});
		
		updateSchema.ExpressionAttributeValues = {
			":a" : isCsv,
			":b" : publishDate,
			":c" : expiry,
			":d" : requireApproval,
			":e" : target
		}

		newCacheObj.empArray = target;

		updateSchema.Key = {
			"formId" : formId
		}

		docClient.update(updateSchema, (err, data) => {
	    if(err)
	      console.log('error in updating data' + JSON.stringify(err));
	    else {
	    	
	    	approvalCache = npmCache.get('approvalCache');
				publishCache = npmCache.get('publishForm');
	      
	      publishCache[index] = Object.assign({},newCacheObj);
	      approvalCache[formId] = requireApproval;
	      
	      npmCache.put('publishForm', publishCache);
				npmCache.put('approvalCache', approvalCache);
	      
	      res.send("refresh-form-publish-cache");
	    }
	  });
	} else {
		//first time form publish
		params.Item.formId = formId;
		params.Item.empArray = empArray;
		params.Item.approval = requireApproval;
		params.Item.isCsv = isCsv;
		params.Item.publishDate = publishDate;
		params.Item.expiry = expiry;
		docClient.put(params, (err, data) => {
			if(err) {
				console.log('error in adding data to db');
				console.log(JSON.stringify(err));
			} else {
				
				approvalCache = npmCache.get('approvalCache');
				publishCache = npmCache.get('publishForm');
				
				publishCache.push(Object.assign({},newCacheObj));
				approvalCache[formId] = requireApproval;

				npmCache.put('publishForm', publishCache);
				npmCache.put('approvalCache', approvalCache);
				
				res.send("published");
			}
		});
	}
	/*empArray.forEach((v) => {
		asyncTask.push(callback => {
			let mail = new ews.EmailMessage(exch);
			mail.Subject = ('Action required: Please fill the form pushed to you ' + employeeMap[v].fullName);
			mail.Body = new ews.TextBody('A form has been pushed to you to fill the details - please fill it');
			mail.ToRecipients.Add(testEmail);
			mail.Send().then(() => {
			  callback();
			});
		});
	});*/
}


exports.generateReportCombineCsv = (req,res) => {
	let payload = req.body;
	let reportType = req.body.reportType;
	let formId = req.body.formId.toString();
	let isCsv = req.body.isCsv;
	let nodes = payload.nodes;
	let isBu = !!payload.isBu;

	let publishId = payload.publishId;

	let empArray = [];
	let employeeMap = npmCache.get('employeeMap');

	let empMap = npmCache.get('employeeMap');

	let formDataMap = npmCache.get('formDataMap');
	let recurDataMap = npmCache.get('formDataRecurring');
	let formStructureMap = npmCache.get('formStructure');

	if(payload.nodes === 'everyone') {
		empArray = Object.keys(employeeMap);
	} else {
		if(isBu){
			payload.nodes.forEach((v,i) => {
				empArray = empArray.concat(findAllEmpUnderBu(v));
			})
		} else {
			payload.nodes.forEach((v,i) => {
				empArray = empArray.concat(findAllEmpBelowSeed(parseInt(v)));
			})
		}
	}


	let results = [], headers = ['BU', 'EmpId', 'EmpName'];
	let extra = [], temp2, resultArr, temp3, j, temp6, temp7, temp8, temp9;

	let headerCsvModified = false;
	let realFieldNames = [];


	if (!isCsv) {
		/*get a fixed headers array*/
		temp6 = formStructureMap[formId].structure.properties;
		temp9 = formStructureMap[formId].uiSchema["ui:order"];

		temp9.forEach(v => {
			if(temp6[v].type === 'object') {
				realFieldNames.push(v);
				temp7 = (v + '2');
				extra.push(temp6[v].properties[temp7].title);
			} else if (temp6[v].type === 'array') {
				realFieldNames.push(v);
				extra.push(temp6[v].title)
			} else {
				extra.push(v);
				realFieldNames.push(v)
			}
		});

		extra.push("User's Comment");
		extra.push("Approver's Comment");

		realFieldNames.push('userComment');
		realFieldNames.push('approverComment');
		

		headers = headers.concat(extra);
		if(reportType === 'normal') {
			headers.push('Last Modified Date');
			realFieldNames.push('lastModified');
			results.push(headers);
			empArray.forEach(v => {
				if(v in formDataMap){
					temp3 = formDataMap[v];
					if(formId in temp3){
						//definite data present
						temp3 = temp3[formId];
						temp2 = empMap[v];
						resultArr = [temp2.bu, temp2.empId, temp2.fullName];
						realFieldNames.forEach(v => {
							let test = temp3[v];
							if(test && Array.isArray(test)){
								resultArr.push(test.join(';'));	
							} else if (test && Object.getPrototypeOf(test) === Object.prototype){
								resultArr.push(test[Object.keys(test)[0]]);
							} else
								resultArr.push(test?test:' ');
						});
						results.push(resultArr);
					}
				}
			});
		} else if (reportType === 'recurring') {
			headers.unshift('date');
			results.push(headers);
			empArray.forEach(v => {
				if(v in recurDataMap) {
					temp3 = recurDataMap[v];
					if(publishId in temp3) {
						temp3 = temp3[publishId];
						temp2 = empMap[v];
						for (j in temp3){
							temp8 = temp3[j];
							resultArr = [j, temp2.bu, temp2.empId, temp2.fullName];
							realFieldNames.forEach(v => {
								let test = temp8[v];
								if(test && Array.isArray(test)){
									resultArr.push(test.join(';'));	
								} else if (test && Object.getPrototypeOf(test) === Object.prototype){
									resultArr.push(test[Object.keys(test)[0]]);
								} else
									resultArr.push(test?test:' ');
							});
							results.push(resultArr);
						}
					}
				}
			});
		}
	} else {
		if(reportType === 'normal') {
			empArray.forEach(v => {
				if(v in formDataMap) {
					temp3 = formDataMap[v];
					if(formId in temp3){
						if(!headerCsvModified){
							headerCsvModified = true;
							headers.push(temp3[formId].headers);
							results.push(headers);
						}

						temp2 = empMap[v];
						resultArr = [j, temp2.bu, temp2.empId, temp2.fullName];
						temp3[formId].data.forEach(v => {
							results.push(resultArr.concat(v));
						});
					}
				}
			});
		} else if (reportType === 'recurring') {
			headers.unshift('date');
			empArray.forEach(v => {
				if(v in recurDataMap){
					temp3 = recurDataMap[v];
					if(publishId in temp3) {
						//start adding data to results
						if(!headerCsvModified) {
							headerCsvModified = true;
							headers.push(temp3[publishId].headers);
							results.push(headers);
						}
						temp2 = empMap[v];
						temp8 = temp3[publishId];

						for (j in temp8){
							if(j !== 'type' && j !== 'headers'){
								resultArr = [j, temp2.bu, temp2.empId, temp2.fullName];
								temp8[j].forEach(v => {
									results.push(resultArr.concat(v));
								});
							}
						}
					}
				}
			})
		}
	}

	let name = (new Date()).getTime() + '.csv';
	let name2 = name;
	name  = REPORTS + '/' + name;
	let writeStream = fs.createWriteStream(name);
	writeStream.on('finish', () => {
		res.send({fileName:name2});
	});

	
	results.forEach((v,i) => {
		let x = v.join(',');
		if(i > 0){
			x = '\n' + x;
		}
		writeStream.write(x);
	});
	writeStream.end();
}

exports.publishFormRecurring = (req,res) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	let payload = req.body, empArray = [], temp, params = publishFormRecurring.insertSchema, isCsv, employeeMap, topManagers, maxPublishId, formId = parseInt(payload.formId), actualRecurDays;
	isCsv = payload.isCsv;


	let recurringCache, newObj = {};
	let recName = payload.recName;
		
	employeeMap = npmCache.get('employeeMap');
	topManagers = npmCache.get('nestedMap');
	
	maxPublishId = npmCache.get('maxPublishId');
	++maxPublishId;
	npmCache.put('maxPublishId', maxPublishId);

	if(payload.type === 'everyone') {
		empArray = Object.keys(employeeMap);
	}
	else if (payload.type === 'specific') {
		if(!!payload.isBu){
			payload.nodes.forEach((v,i) => {
				empArray = empArray.concat(findAllEmpUnderBu(v));
			})
		}
		else {
			empArray = payload.nodes || [];
		}

		if(payload.extras.length > 0)
			empArray = empArray.concat(payload.extras.split(','));
	}
	else if (payload.type === 'immediate-child') {
		if(payload.isBu) {
			temp = payload.nodes;
			temp.forEach((v,i) => {
				empArray = empArray.concat(topManagers[v])
			});
		}
		else {
			temp = payload.nodes;
			temp.forEach((v,i) => {
				empArray = empArray.concat(findEmployeesOf(parseInt(v)));
			});
		}
		if(payload.extras.length > 0)
			empArray = empArray.concat(payload.extras.split(','));
	}

	else if (payload.type === 'everyone-below') {
		if(!!payload.isBu){
			payload.nodes.forEach((v,i) => {
				empArray = empArray.concat(findAllEmpUnderBu(v));
			});
		} else {
			payload.nodes.forEach((v,i) => {
				empArray = empArray.concat(findAllEmpBelowSeed(parseInt(v)));
			})
		}
		if(payload.extras.length > 0)
			empArray = empArray.concat(payload.extras.split(','));
	}

	actualRecurDays = calculateAllDaysBetween(payload.expiryStart, payload.expiryEnd, payload.recInterval);
	
	params.Item.publishId = maxPublishId;
	params.Item.formId = formId;
	params.Item.empArray = empArray;
	params.Item.isCsv = isCsv;
	params.Item.actualRecurDays = actualRecurDays;
	params.Item.publishDate = payload.publishDate;
	params.Item.recName = recName;

	newObj = {
		formId: formId,
		empArry: empArray,
		isCsv: isCsv,
		actualRecurDays: actualRecurDays,
		publishDate: payload.publishDate,
		recName: recName
	}

	docClient.put(params, (err, data) => {
		if(err) {
			console.log('error in adding data to db');
			console.log(JSON.stringify(err));
		} else {
			recurringCache = npmCache.get('publishFormRecurring');
			recurringCache[maxPublishId] = Object.assign({},newObj);
			npmCache.put('publishFormRecurring',recurringCache);
			res.send("published");
		}
	});	
}

exports.viewCache = (req,res) => {
	let cache;
	Q.all([dataCache.buildFormdataCache()]).then(r => {
		cache = npmCache.get('formDataMap');
		res.send(JSON.stringify(cache));
	});
}

exports.initialize = (req,res) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	if(!firstTimeStarted){
		firstTimeStarted = true;
		//create all cache
		Q.all([dataCache.formStructureCache(), dataCache.buildNestedMap(), dataCache.queryPublish(), dataCache.queryPublishRecurring(), dataCache.buildFormdataCache(), dataCache.buildFormdataRecurringCache(), dataCache.queryUsers(), dataCache.getHierarchy(), dataCache.queryRole()]).then(r => {
			console.log('first time');
			somethingElse();
		})
	} else {
		somethingElse();
	}
	function somethingElse(){
		let email = req.params.email, findE, userDetailCache, formsForApproval = [], hierarchy, publishForms, expiry, today = new Date(), whichForms = [], publishFormRecurring, todayStr;
		let i, resultRecur=[], t2;
		today.setHours(0,0,0,0);
		todayStr = today.toDateString();
		userDetailCache = npmCache.get('userDetails');
		hierarchy = npmCache.get('hierarchyMap');
		publishForms = npmCache.get('publishForm');
		publishFormRecurring = npmCache.get('publishFormRecurring');
		if(userDetailCache.length === 0) 
			res.send({ firstTime:true });

		let target = userDetailCache.filter((v,i) => {
			return v.email.trim() === email
		});

		let empId = target[0].empId.toString();
		publishForms.forEach((v,i) => {
			let test = v.empArray.indexOf(empId) !== -1;
			if(test){
				if(v.expiry){
					if(v.expiry !== 'na') {
						expiry = new Date(v.expiry);
						expiry.setHours(0,0,0,0);
						test = (today <= expiry);	
					} else 
						test = true;
				}
			}
			if(test)
				whichForms.push(v.formId);
			let arr = v.empArray;
			let approval = v.approval;
			if(approval) {
				arr.forEach((v1,i1) => {
					if(hierarchy[v1].toString() === empId) {
						formsForApproval.push({
							empId:v1,
							formId:v.formId
						});
					}
				});
			}
		});

		for (i in publishFormRecurring) {
			t2 = publishFormRecurring[i];
			if (t2.empArry.indexOf(empId) !== -1 && t2.actualRecurDays.indexOf(todayStr) !== -1) {
				resultRecur.push({
					publishId:i,
					formId:t2.formId
				});
			}
		}
		res.send({
			whichForm:whichForms,
			empId:empId,
			approvalForms:formsForApproval,
			firstTime:false,
			recurring:resultRecur,
			publishFormMap:publishFormRecurring
		});
		
	}
}

exports.getFormStructures = (req,res) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	let temp = npmCache.get('formStructureSQL');
	res.send({
		formStructure:temp
	});
}

exports.getInitialData = (req,res) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	Q.all([dataCache.buildFormdataCache()]).then((results) => {
		var x = npmCache.get('formDataMap');
		res.send({
			initialData:x
		})
	});
}


exports.updateFormdata = (req,res) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	let payload = req.body;
	let initialData;
	let insertSchema = formData.insertSchema;
	let updateSchema = formData.updateSchema;

	let approvalCache, initialDataCache;
	
	let empId = parseInt(payload.empId);
	let formId = payload.formId;
	let data = payload.data;
	let sendApprovalMail = false;
	let asyncTask = [];
  let employeeMap = npmCache.get('employeeMap');

  let newObj = {};

	initialData = npmCache.get('formDataMap');
	approvalCache = npmCache.get('approvalCache');
	
	if(!initialData[empId]){
		//insert a row into formData table - use insert schema
		if(approvalCache[formId] && approvalCache[formId] !== 'not-needed'){
			data.approval = "sent-for-approval";
			//sendApprovalMail = true;
		} else {
			data.approval = "not-needed";
		}

		data.lastModified = (new Date()).toDateString();

		insertSchema.Item.empId = empId;
		insertSchema.Item.fData = {
			[formId] : data
		}

		newObj[formId] = data; 

		docClient.put(insertSchema, (err, data) => {
			if(err) {
				console.log('error in adding data to db');
				console.log(JSON.stringify(err));
			} else {
				initialData = npmCache.get('formDataMap');
				initialData[empId] = newObj;
				npmCache.put('formDataMap',initialData);
				res.send({payload:initialData});
			}
		});

		/*if(sendApprovalMail) {
			asyncTask.push(callback => {
				let mail = new ews.EmailMessage(exch);
				mail.Subject = ('Action required: Form submitted for your approval by ' + employeeMap[empId].fullName);
				mail.Body = new ews.TextBody('A form has been filled by '+employeeMap[empId].fullName+' is waiting your approval - Login to TII Dashboard to approve this');
				mail.ToRecipients.Add(testEmail);
				mail.Send().then(() => {
				  callback();
				});
			});
		}*/
	}
	else {
		//employee is present - update the data
		if(approvalCache[formId] && approvalCache[formId] !== 'not-needed') {
			data.approval = "sent-for-approval";
			//sendApprovalMail = true;
		} else {
			data.approval = "not-needed";
		}

		data.lastModified = (new Date()).toDateString();
		
		initialData = initialData[empId];
		initialData[formId] = data;
		updateSchema.ExpressionAttributeValues = {
			":a" : initialData
		}
		updateSchema.Key = {
			"empId" : empId
		}

		docClient.update(updateSchema, (err, data) => {
	    if(err)
	      console.log('error in updating data' + JSON.stringify(err));
	    else {
	      initialDataCache = npmCache.get('formDataMap');
	      initialDataCache[empId] = Object.assign({},initialData);
	      npmCache.put('formDataMap',initialDataCache);
	      res.send({payload:initialDataCache});
	    }
	  });

		/*if(sendApprovalMail) {
		  asyncTask.push(callback => {
		    let mail = new ews.EmailMessage(exch);
		    mail.Subject = ('Action required: Form submitted for your approval by ' + employeeMap[empId].fullName);
		    mail.Body = new ews.TextBody('A form has been filled by '+employeeMap[empId].fullName+' is waiting your approval - Login to TII Dashboard to approve this');
		    mail.ToRecipients.Add(testEmail);
		    mail.Send().then(() => {
		      callback();
		    });
		  });
		}*/
	
	}
}

exports.updateFormdataRecurring = (req,res) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	let payload = req.body;
	let initialData;
	let insertSchema = formDataRecurring.insertSchema;
	let updateSchema = formDataRecurring.updateSchema;
	let empId = payload.empId;
	let data = payload.data;
	let publishId = payload.publishId;
	let dateString = payload.dateString;

	let newObj = {}, initialDataCache;

	initialData = npmCache.get('formDataRecurring');

	if(!initialData[empId]) {
		//insert a row into formData table - use insert schema
		insertSchema.Item.empId = parseInt(payload.empId);
		data = {
			[dateString]: data
		};
		insertSchema.Item.fData = {
			[publishId] : data
		}
		newObj = {
			[publishId] : data	
		}
		docClient.put(insertSchema, (err, data) => {
			if(err) {
				console.log('error in adding data to db');
				console.log(JSON.stringify(err));
			} else {
				initialDataCache = npmCache.get('formDataRecurring');
				initialDataCache[empId] = newObj;
				npmCache.put('formDataRecurring', initialDataCache);
				res.send({payload:initialDataCache});
			}
		});
	}
	else {
		initialData = initialData[empId];
		if(initialData[publishId]){
			initialData[publishId][dateString] = data;
		} else {
			initialData[publishId] = {
				[dateString]:data
			}
		};
		updateSchema.ExpressionAttributeValues = {
			":a" : initialData
		}
		updateSchema.Key = {
			"empId" : parseInt(empId)
		}
		docClient.update(updateSchema, (err, data) => {
	    if(err)
	      console.log('error in updating data' + JSON.stringify(err));
	    else {
	    	initialDataCache = npmCache.get('formDataRecurring');
	    	initialDataCache[empId] = Object.assign({},initialData);
	    	npmCache.put('formDataRecurring',initialDataCache)
	      res.send({payload:initialDataCache});
	    }
	  });		
	}
}


exports.updateApproval = (req,res) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	let formDataMap;
	let payload = req.body;
	let empId = payload.empId;
	let updateSchema = formData.updateSchema;
	let temp;
	let formId = payload.formId;

	let newObj = {};

	formDataMap = npmCache.get('formDataMap');
	temp = formDataMap[empId];
	temp[formId].approval = payload.approvalStatus;
	temp[formId].approver = payload.approver;
	temp[formId].approverComment = payload.approverComment || ' ';
	updateSchema.ExpressionAttributeValues = {
		":a" : temp
	}
	updateSchema.Key = {
		"empId" : parseInt(empId)
	}
	docClient.update(updateSchema, (err, data) => {
		if(err)
			console.log('error in updating data' + JSON.stringify(err));
		else {
			console.log('formData updated successfully');
			formDataMap = npmCache.get('formDataMap');
			formDataMap[empId] = Object.assign({},temp);
			npmCache.put('formDataMap',formDataMap);
			res.send({payload:formDataMap});
		}
	});
}

exports.setFormStructure = (req,res) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	let payload = req.body;
	let pk;
	let schema = formStructure.insertSchema;
	let immediate = payload.immediatePush;
	let description = payload.description;
	let structure = payload.structure;
	let name = payload.formName;
	let uiSchema = payload.uiSchema;
	let newCacheObj = {};

	let formStructureCache, formStructureSQLCache;

	pk = npmCache.get('maxFormId') + 1;
	npmCache.put('maxFormId', pk);
	
	schema.Item.formId = pk;
	schema.Item.formName = name;
	schema.Item.structure = structure;
	schema.Item.description = description;
	schema.Item.uiSchema = uiSchema;
	schema.Item.archived = false;

	newCacheObj = {
		formId: pk,
		uiSchema: uiSchema,
		formName: name,
		structure: structure,
		description: description,
		archived: false
	};

	docClient.put(schema, (err, data) => {
		if(err) {
			console.log('error in adding data to db');
			console.log(JSON.stringify(err));
		} else {
			
			formStructureCache = npmCache.get('formStructure');
			formStructureSQLCache = npmCache.get('formStructureSQL');
			
			formStructureCache[pk] = Object.assign({},newCacheObj);
			formStructureSQLCache.push(Object.assign({},newCacheObj));
			
			npmCache.put('formStructure',formStructureCache);
			npmCache.put('formStructureSQL',formStructureSQLCache);
			
			if(immediate) {
				res.send({pushImmediate:pk, payload:formStructureSQLCache});
			} else {
				res.send({payload:formStructureSQLCache});
			}
		}
	});
}

exports.generateReport = (req,res) => {
	let payload = req.body;
	let start = payload.nodes[0];
	let formId = payload.formId;
	let result;
	let aggFunction = payload.aggregateFunction;
	let formStructure,i;
	let agg = {};
	let isBu = Boolean(payload.isBu);
	Q.all([dataCache.buildFormdataCache(), dataCache.formStructureCache(), dataCache.getHierarchy(), dataCache.buildNestedMap()]).then((results) => {
		/*create the aggFunction of all the required fields*/
		formStructure = npmCache.get('formStructure');
		formStructure = formStructure[formId].structure.properties;
		for (i in formStructure) {
			if(i !== 'comments') {
				agg[i] = aggFunction;
			}
		}		
		result = deepSum(start, formId, agg, isBu);
		res.send(result);
	});
}




exports.downloadTemplateIndex = (req,res) => {
	let tempName = "template.csv";
	res.setHeader('Content-disposition', 'attachment; filename='+tempName);
	res.download(req.body.templateName);
}


exports.downloadReport = (req,res) => {
	let reportName2 = req.body.reportName;
	let reportName = REPORTS + '/' + reportName2;
	//reportName = reportName.split('/').pop();
	res.setHeader('Content-disposition', 'attachment; filename='+reportName2);
	res.download(reportName);
}



exports.getRole = (req,res) => {
	let userList;
	let empId = parseInt(req.params.empId);
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');

	let roleCache = npmCache.get('roles');

	let role = ((roleCache.admin.indexOf(empId) !== -1)?'admin':((roleCache.reporter.indexOf(empId) !== -1)?'reporter':'user'));
	res.send(role);
}


exports.setRole = (req,res) => {
	let newRole = req.body;
	let schema = roles.updateSchema;
	let roleCache;
	schema.Key.pk = 1;
	schema.ExpressionAttributeValues = {
		":a":newRole
	}

	docClient.update(schema, function(err, data) {
    if (err) {
      console.error("Unable to update role:", JSON.stringify(err));
    } else {
      npmCache.put('roles',newRole);
      res.send({payload:newRole});
    }
	});
}


exports.getRoleMap = (req,res) => {
	let roleCache = npmCache.get('roles');
	res.send(roleCache);
}


exports.deleteForms = (req,res) => {
	let delArr = req.body.deleteArr;
	let asyncTask = [];
	let schema, formSqlCache, formStructureCache;
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	delArr.forEach(v => {
		asyncTask.push(callback => {
			schema = formStructure.deleteSchema;
			schema.Key.formId = v;

			schema.ExpressionAttributeValues = {
				":a" : true
			};

			docClient.update(schema, function(err, data) {
		    if (err) {
	        console.error("Unable to delete form:", JSON.stringify(err));
	        callback();
		    } else {
		      callback();
		    }
			});
		});
	});

	async.parallel(asyncTask, function() {
  	formSqlCache = npmCache.get('formStructureSQL');
  	formStructureCache = npmCache.get('formStructure');

  	formSqlCache.forEach(v => {
  		if(delArr.indexOf(v.formId) !== -1) {
  			v.archived = true;
  			formStructureCache[v.formId].archived = true;
  		}
  	});

  	npmCache.put('formStructureSQL',formSqlCache);
  	npmCache.put('formStructure',formStructureCache);

  	res.send({payload:formSqlCache});
	});
}




exports.getRecurringData = (req,res) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	let cache;
	Q.all([dataCache.buildFormdataRecurringCache()]).then(r => {
		cache = npmCache.get('formDataRecurring');
		res.send(cache);
	})
}
