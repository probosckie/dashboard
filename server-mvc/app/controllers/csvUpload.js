const path = require('path');
const UPLOADS = path.join(__dirname, '../..', 'uploads');
const TEMPLATES = path.join(__dirname, '../..', 'templates');
const async = require('async');
const parse = require('csv-parse');
const docClient = require('../../config/database').docClient;
const fs = require('fs');
const userDetails = require('../models/userDetails');
const userHierarchy = require('../models/userHierarchy');
const formData = require('../models/formData');
const formStructure = require('../models/formStructure');
const formDataRecurring = require('../models/formDataRecurring');
const createdBy = "Prabhas";
const dataCache = require('./dataCache');
const npmCache = require('memory-cache');
const Q = require('q');
/*const ews = require("ews-javascript-api");
const credentials = require('../../config/emailConfig.js');*/

let i, now;

let empIdMap, userDetailCache;

/*
const testEmail = 'krishna.khanapure@timeinc.com';

const exch = new ews.ExchangeService(ews.ExchangeVersion.Exchange2013);
exch.Credentials = new ews.ExchangeCredentials(credentials.email, credentials.password);
exch.Url = new ews.Uri("https://outlook.office365.com/Ews/Exchange.asmx");*/

function diffObject(oldO, newO, fields) {
	let i, diff = {};
	let now = new Date();
	let foundDiff = false;
	fields.forEach((v, i) => {
		if (newO[v] !== oldO[v]) {
			diff[v] = oldO[v];
			foundDiff = true
		}
	})
	diff.modifiedBy = oldO.modifiedBy;
	diff.from = oldO.modifiedOn;
	diff.till = now.toString();
	if (foundDiff)
		return diff;
	else
		return -1;
}

exports.postOrg = (req, res) => {
	userDetailCache = dataCache.getDetailsCache('userDetails');
	if (!userDetailCache) {
		Q.fcall(dataCache.queryUsers).then((results) => {
			userDetailCache = dataCache.getDetailsCache('userDetails');
			empIdMap = npmCache.get('allEmpIds');
			addUsersToTable();
		});
	} else {
		empIdMap = npmCache.get('allEmpIds');
		addUsersToTable();
	}

	function addUsersToTable() {
		let fileInfo = req.file;
		let fn = UPLOADS + '/' + fileInfo.filename;
		var parser = parse({
			delimiter: ','
		}, function(err, data) {
			let asyncTask = [];
			async.eachSeries(data, function(line, callback) {
				asyncTask.push(function(callback) {
					let insertObject = userDetails.insertSchema;
					let corresponding, archive, diffArchive;
					now = new Date();
					if (line.indexOf('empId') === -1) {
						userDetails.fields.forEach(function(v, i) {
							if (v === 'empId')
								insertObject.Item[v] = parseInt(line[i]);
							else if (v === 'managerEmpId')
								insertObject.Item[v] = (isNaN(line[i])?0:parseInt(line[i]))
							else
								insertObject.Item[v] = line[i];
						});
						corresponding = empIdMap.indexOf(insertObject.Item['empId']);
						if (corresponding !== -1) {
							corresponding = userDetailCache[corresponding];
							archive = corresponding.archiveRoles;
							diffArchive = diffObject(corresponding, insertObject.Item, userDetails.fields);
							if (diffArchive !== -1) {
								archive.push(diffArchive);
								insertObject.Item.archiveRoles = archive;
								insertObject.Item.modifiedBy = createdBy;
								insertObject.Item.modifiedOn = now.toString();
								insertObject.Item.createdBy = corresponding.createdBy;
								insertObject.Item.createdOn = corresponding.createdOn;
							} else {
								insertObject.Item.archiveRoles = archive;
								insertObject.Item.modifiedBy = corresponding.modifiedBy;
								insertObject.Item.modifiedOn = corresponding.modifiedOn;
								insertObject.Item.createdBy = corresponding.createdBy;
								insertObject.Item.createdOn = corresponding.createdOn;
							}
						} else {
							insertObject.Item.archiveRoles = [];
							insertObject.Item.createdBy = createdBy;
							insertObject.Item.createdOn = now.toString();
							insertObject.Item.modifiedOn = now.toString();
							insertObject.Item.modifiedBy = createdBy;
						}
						docClient.put(insertObject, (err, data) => {
							if (err) {
								console.log('error in inserting details');
								console.log(JSON.stringify(err));
							}
							callback();
						});
					}
					else
						callback();
				});
				if (line.indexOf('empId') === -1) {
          asyncTask.push((callback) => {
            let insertHierarchyObject = userHierarchy.insertSchema;
            insertHierarchyObject.Item = {};
            insertHierarchyObject.Item.empId = parseInt(line[0]);
            insertHierarchyObject.Item.managerEmpId = (isNaN(line[3])?0:parseInt(line[3]));
            docClient.put(insertHierarchyObject, (err, data) => {
              if (err) {
                console.log('error in inserting hierarchy');
                console.log(JSON.stringify(err));
              } else 
                console.log('successfully inserted hierarchy');
              callback();
            }); 
          });
        }
				callback();
			});

			async.parallel(asyncTask, function() {
				console.log('rows inserted');
				npmCache.del('employeeMap');
				npmCache.del('userDetails');
				npmCache.del('allEmpIds');
				npmCache.del('publishForm');
				npmCache.del('userHierarchy');
				npmCache.del('buArray');
				npmCache.del('managerArray');
				npmCache.del('nestedMap');
				npmCache.del('formDataMap');
				res.send("data inserted");
			});
		});
		fs.createReadStream(fn).pipe(parser);
	}
}

exports.downloadTemplate = (req, res) => {
	let tempName = "template.csv";
	res.setHeader('Content-disposition', 'attachment; filename='+tempName);
	res.download(TEMPLATES + '/sample-new.csv');
}


exports.postData = (req,res) => {
	let fileInfo = req.file;
	let fn = UPLOADS + '/' + fileInfo.filename;
	let formId = req.params.formId;
	let formDataM, formDataCache;
	let header = [],empId, cache,i,temp,temp2,schema;


	formDataM = npmCache.get('formDataMap');
	
	let parser = parse({
		delimiter: ','
	}, (err,data) => {
		let asyncTask = [];
		async.eachSeries(data, function(line, callback) {
			asyncTask.push(function(callback) {
				if(line.indexOf('empId') !== -1) {
					line.shift();
					header = line;
					callback();
				} else {
					empId = line[0];
					cache = formDataM[empId];
					temp = {};
					header.forEach((v,i) => {
						temp[v] = line[i+1];						
					});
					temp.approval = 'approved';
					if(cache) {
						//update the existing fData - use update schema
						cache[formId] = temp;
						schema = formData.updateSchema;
						schema.ExpressionAttributeValues = {
							":a" : cache
						};
						schema.Key = {
						"empId" : parseInt(empId)
						};
						docClient.update(schema, (err, data) => {
							if(err)
								console.log('error in updating form data' + JSON.stringify(err));
							else {
								console.log('data updated');
								formDataCache = npmCache.get('formDataMap');
								formDataCache[empId] = Object.assign({},cache);
								npmCache.put('formDataMap', formDataCache);
								callback();
							}
						});
					} else {
						//insert a new employee object in formData
						temp2 = {};
						temp2.empId = parseInt(empId);
						temp2.fData = {[formId]:temp};
						schema = formData.insertSchema;
						schema.Item = temp2;
						docClient.put(schema, (err, data) => {
            if (err) {
              console.log('error in inserting formData');
              console.log(JSON.stringify(err));
            } 
            else {
            	formDataCache = npmCache.get('formDataMap');
            	formDataCache[empId] = {[formId]:temp};
            	npmCache.put('formDataMap',formDataCache);
            	console.log('added data');
            	callback();
            }
          	}); 
					}
				}		
			});
			callback();
		});
		async.parallel(asyncTask, function() {
			formDataCache = npmCache.get('formDataMap');
			res.send({payload:formDataCache});
		});
	});
	fs.createReadStream(fn).pipe(parser);
}

exports.publishCsvForm = (req,res) => {
	let pk, formStructureCache, formStructureSQLCache, structure = {}, newCacheObj = {};
	
	let fileInfo = req.file;
	let formName = req.params.formTitle;
	let fn = UPLOADS + '/' + fileInfo.filename;
	
	structure.title = formName;
	structure.type = "csv";
	structure.csvTemplateName = fn;
	
	
	let schema = formStructure.insertSchema;

	pk = npmCache.get('maxFormId') + 1;
	npmCache.put('maxFormId', pk);

	
	schema.Item.formId = pk;
	schema.Item.formName = formName;
	schema.Item.structure = structure;
	schema.Item.acrhived = false;

	newCacheObj = {
		formId: pk,
		formName: formName,
		structure: structure,
		archived: false
	};

	
	docClient.put(schema, (err, data) => {
		if(err) {
			console.log('error publishing form structure');
			console.log(JSON.stringify(err));
		} else {
			formStructureCache = npmCache.get('formStructure');
			formStructureSQLCache = npmCache.get('formStructureSQL');
			
			formStructureCache[pk] = Object.assign({},newCacheObj);
			formStructureSQLCache.push(Object.assign({},newCacheObj));
			
			npmCache.put('formStructure',formStructureCache);
			npmCache.put('formStructureSQL',formStructureSQLCache);
			
			res.send({payload:formStructureSQLCache})
		}
	});
}

exports.postCsvTemplateData = (req,res) => {
	let fileInfo = req.file;
	let fn = UPLOADS + '/' + fileInfo.filename;
	const formId = req.params.formId;
	const empId = req.params.empId;
	let insertSchema = formData.insertSchema;
	let updateSchema = formData.updateSchema;
	let innerData = {}, initialData;
	let approvalCache;
	let sendApprovalMail = false;
	
	let asyncTask = [];
	let employeeMap = npmCache.get('employeeMap');

	let newObj = {}, initialDataCache;


	initialData = npmCache.get('formDataMap');
	approvalCache = npmCache.get('approvalCache');
	
	var parser = parse({
		delimiter: ','
	}, function(err, data) {
		innerData.type = "csv";
		innerData.headers = data[0];
		data.shift();
		innerData.data = data;
		if(!initialData[empId]){
			if(approvalCache[formId] && approvalCache[formId] !== 'not-needed') {
				innerData.approval = 'sent-for-approval';
				//sendApprovalMail = true;
			} else {
				innerData.approval = 'not-needed';
			}
			insertSchema.Item.empId = parseInt(empId);
			insertSchema.Item.fData = {
				[formId] : innerData
			}

			newObj = {
				[formId] : innerData
			}

			asyncTask.push(callback => {
				docClient.put(insertSchema, (err, data) => {
					if(err) {
						console.log('error in adding data to db');
						console.log(JSON.stringify(err));
						callback();
					} else {
						callback();
					}
				});
			});

			/*if(sendApprovalMail){
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
			async.parallel(asyncTask, function() {
				initialData = npmCache.get('formDataMap');
				initialData[empId] = Object.assign({},newObj);
				npmCache.put('formDataMap',initialData);
				res.send({payload:initialData});
			});
		} else {
			if(approvalCache[formId] && approvalCache[formId] !== 'not-needed') {
				innerData.approval = 'sent-for-approval';
				//sendApprovalMail = true;
			} else {
				innerData.approval = 'not-needed';
			}

			initialData = initialData[empId];
			initialData[formId] = innerData;
			updateSchema.ExpressionAttributeValues = {
				":a" : initialData
			}
			updateSchema.Key = {
				"empId" : parseInt(empId)
			}
			
			asyncTask.push(callback => {
				docClient.update(updateSchema, (err, data) => {
					if(err)
						console.log('error in updating data' + JSON.stringify(err));
					else {
						console.log('formData updated successfully');
						callback();
					}
				});
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
			async.parallel(asyncTask, function() {
				initialDataCache = npmCache.get('formDataMap');
				initialDataCache[empId] = initialData;
				npmCache.put('formDataMap',initialDataCache);
				res.send({payload:initialDataCache});
			});
		}
	});
	fs.createReadStream(fn).pipe(parser);
	
}


exports.postCsvTemplateDataRecurring = (req,res) => {
	const publishId = req.params.publishId;
	const empId = req.params.empId;
	const today = req.params.today;
	let fileInfo = req.file;
	let fn = UPLOADS + '/' + fileInfo.filename;
	let insertSchema = formDataRecurring.insertSchema;
	let updateSchema = formDataRecurring.updateSchema;
	let recurData, innerData = {}, outerData = {};

	let newObj = {}, recurDataCache;

	recurData = npmCache.get('formDataRecurring');
	recurData = recurData[empId];
	

	var parser = parse({
		delimiter: ','
	}, function(err, data) {
		if(!recurData) {
			//insert into formDataRecurring with the csv
			innerData.headers = data[0];
			data.shift();
			innerData.type="csv";
			innerData[today] = data;
			outerData[publishId] = innerData;
			insertSchema.Item.empId = parseInt(empId);
			insertSchema.Item.fData = outerData;

			docClient.put(insertSchema, (err, data) => {
				if(err) {
					console.log('error in adding data to db');
					console.log(JSON.stringify(err));
				} else {
					recurData = npmCache.get('formDataRecurring');
					recurData[empId] = Object.assign({},outerData);
					npmCache.put('formDataRecurring', recurData);
					res.send({payload:recurData});
				}
			});
		} else {
			//update the corresponding csv data entry
			if (recurData[publishId]) {
				outerData = recurData[publishId];
				data.shift();
				outerData[today] = data;
			} else {
				innerData.headers = data[0];
				data.shift();
				innerData.type="csv";
				innerData[today] = data;
				recurData[publishId] = innerData;
			}
			
			updateSchema.ExpressionAttributeValues = {
				":a" : recurData
			}

			updateSchema.Key = {
				"empId" : parseInt(empId)
			}

			docClient.update(updateSchema, (err, data) => {
		    if(err)
		      console.log('error in updating data' + JSON.stringify(err));
		    else {
					recurDataCache = npmCache.get('formDataRecurring');
					recurDataCache[empId] = recurData;
					npmCache.put('formDataRecurring', recurDataCache);
		      res.send({payload:recurDataCache});
		    }
		  });
		}
	});
	fs.createReadStream(fn).pipe(parser);	
}


