const docClient = require('../../config/database').docClient;
const npmCache = require('memory-cache');
const Q = require('q');
const userDetails = require('../models/userDetails');
const userHierarchy = require('../models/userHierarchy');
const formData = require('../models/formData');
const publishForm = require('../models/publishForm');
const publishFormRecurring = require('../models/publishFormRecurring');
const formDataRecurring = require('../models/formDataRecurring');
const formStructure = require('../models/formStructure');
const roles = require('../models/roles');



let getDetailsCache = (key) => {
	return npmCache.get(key);
}

let deleteCache = (key) => {
	npmCache.del(key);
}

const setKey = (key,value) =>  {
	npmCache.put(key,value);
}


function queryRole(){
  var defered = Q.defer();
  if(!!npmCache.get('roles'))
  	defered.resolve();

  docClient.scan(roles.selectSchema, (err, data) => {
		if(err) {
			console.log('error in retrieving data');
			console.log(JSON.stringify(err));
			defered.reject();
		}
		else {
			npmCache.put('roles', data.Items[0].roleList);
			defered.resolve();
		}
	});
  return defered.promise;
}


function queryUsers(){
  var defered = Q.defer();
  if(!!npmCache.get('userDetails') && !!npmCache.get('employeeMap') && !!npmCache.get('allEmpIds'))
  	defered.resolve();

  let employeeMap = {}, allEmpIds = [];
  docClient.scan(userDetails.selectSchema, (err, data) => {
		if(err){
			console.log('error in retrieving data');
			console.log(JSON.stringify(err));
			defered.reject();
		}
		else {
			data.Items.forEach((v,i) => {
				employeeMap[v.empId] = v;
			});
			allEmpIds = data.Items.map(v => v.empId);				
			npmCache.put('userDetails', data.Items);
			npmCache.put('employeeMap', employeeMap);
			npmCache.put('allEmpIds', allEmpIds);
			defered.resolve();
		}
	});
  return defered.promise;
}

function formStructureCache(){
  var defered = Q.defer();
  
  if(!!npmCache.get('formStructure') && !!npmCache.get('formStructureSQL') && !!npmCache.get('maxFormId'))
  	defered.resolve();

  let formCache = {};
  let max = -1;
  docClient.scan(formStructure.selectSchema, (err, data) => {
		if(err){
			console.log('error in retrieving data');
			console.log(JSON.stringify(err));
			defered.reject();
		}
		else {
			if(data.Items.length === 0)
				max = 0;

			data.Items.forEach((v,i) => {
				formCache[v.formId] = v;
				if(parseInt(v.formId) > max) {
					max = parseInt(v.formId);
				}
			});

			npmCache.put('formStructure', formCache);
			npmCache.put('formStructureSQL', data.Items);
			npmCache.put('maxFormId', max);
			defered.resolve();
		}
	});
  return defered.promise;
}


function queryPublish(){
	var defered = Q.defer();
	if (npmCache.get('publishForm') && npmCache.get('approvalCache'))
		defered.resolve();

	let approvalCache = {};
  docClient.scan(publishForm.selectSchema, (err, data) => {
		if(err){
			console.log('error in retrieving data');
			console.log(JSON.stringify(err));
			defered.reject();
		}
		else {
			data.Items.forEach((v,i) => {
				approvalCache[v.formId] = v.approval;
			})
			npmCache.put('publishForm', data.Items);
			npmCache.put('approvalCache', approvalCache);
			defered.resolve();
		}
	});
  return defered.promise;
}


function queryPublishRecurring(){
	var defered = Q.defer();
	if(!!npmCache.get('publishFormRecurring') && !!npmCache.get('maxPublishId'))
		defered.resolve();

	let publishRecurringCache = {};
	let max = -1;
  docClient.scan(publishFormRecurring.selectSchema, (err, data) => {
		if(err){
			console.log('error in retrieving data');
			console.log(JSON.stringify(err));
			defered.reject();
		}
		else {
			if(data.Items.length === 0)
				max = 0;

			data.Items.forEach(v => {
				
				if(parseInt(v.publishId) > max)
					max = v.publishId;

				publishRecurringCache[v.publishId] = {
					formId:v.formId,
					empArry:v.empArray,
					isCsv:v.isCsv,
					actualRecurDays:v.actualRecurDays,
					publishDate:v.publishDate,
					recName:v.recName,
					publishId:v.publishId
				};
			});
			npmCache.put('publishFormRecurring', publishRecurringCache);
			npmCache.put('maxPublishId', max);
			defered.resolve();
		}
	});
  return defered.promise;
}


function getHierarchy(){
	var defered = Q.defer();

	if(npmCache.get('userHierarchy') && npmCache.get('hierarchyMap'))
		defered.resolve();

	let hierarchyMap ={};
  docClient.scan(userHierarchy.selectSchema, (err, data) => {
		if(err){
			console.log('error in retrieving data');
			console.log(JSON.stringify(err));
			defered.reject();
		}
		else {
			data.Items.forEach((v,i) => {
				hierarchyMap[v.empId] = v.managerEmpId;
			});
			npmCache.put('userHierarchy', data.Items);
			npmCache.put('hierarchyMap', hierarchyMap);
			defered.resolve();
		}
	});
  return defered.promise;
}



function buildEmployeeMap(){
	var defered = Q.defer();
	if(npmCache.get('buArray') && npmCache.get('managerArray'))
		defered.resolve();

	let userDetailCache = getDetailsCache('userDetails');
	let hierarchy = getDetailsCache('userHierarchy');
	let buArray = [];
	let managerArray = [];
	if (!(!!userDetailCache && !!hierarchy)) {
		Q.all([queryUsers(), getHierarchy()]).then((results) => {
			userDetailCache = getDetailsCache('userDetails');
			hierarchy = getDetailsCache('userHierarchy');
			prepareEmployeeMap();
		});
	}
	else {
		prepareEmployeeMap();
	}

	function prepareEmployeeMap(){
		userDetailCache.forEach((v,i) => {
			if(buArray.indexOf(v.bu) === -1) {
				buArray.push(v.bu)
			}

			if(v.managerEmpId !== 0 && managerArray.indexOf(v.managerEmpId) === -1) {
				managerArray.push(v.managerEmpId)
			}
		});
		npmCache.put("buArray",buArray);
		npmCache.put("managerArray",managerArray);
		//console.log(npmCache.get('buArray'));
		//console.log(npmCache.get('managerArray'));
		defered.resolve();
	}
	return defered.promise;
}


function buildNestedMap() {
	var defered = Q.defer();
	
	if(npmCache.get('nestedMap'))
		defered.resolve();
	
	Q.all([buildEmployeeMap()]).then((results) => {
		let employeeMap = npmCache.get('employeeMap');
		let buArray = npmCache.get('buArray');
		let managerArray = npmCache.get('managerArray');
		let hierarchy = npmCache.get('hierarchyMap');
		let arr={};
		let i,j;
		let topManagers;
		buArray.forEach((v,i) => {
		 	arr[v] = []
		});

		topManagers = managerArray.filter((v,i) => {
			return hierarchy[v] === 0;
		});

		topManagers.forEach((v,i) => {
			let buM = employeeMap[v].bu;
			arr[buM].push(v);
		});
		npmCache.put("nestedMap",arr);
		defered.resolve();
	});
	return defered.promise; 
}



function buildFormdataCache(){
	var defered = Q.defer();
	if(npmCache.get('formDataMap'))
		defered.resolve();
	let map = {};
	let items;
  docClient.scan(formData.selectSchema, (err, data) => {
		if(err){
			console.log('error in retrieving data');
			console.log(JSON.stringify(err));
			defered.reject();
		}
		else {
			items = data.Items;
			if(items.length > 0) {
				items.forEach((v,i) => {
					map[v.empId] = v.fData;
				});
				npmCache.put("formDataMap",map);
				defered.resolve();
			}
			else {
				npmCache.put("formDataMap",{});
				defered.resolve();
			}
		}
	});
  return defered.promise;
}


function buildFormdataRecurringCache() {
	var defered = Q.defer();
	if(npmCache.get('formDataRecurring'))
		defered.resolve();
	let map = {};
	let items;
  docClient.scan(formDataRecurring.selectSchema, (err, data) => {
		if(err){
			console.log('error in retrieving data');
			console.log(JSON.stringify(err));
			defered.reject();
		}
		else {
			items = data.Items;
			if(items.length > 0) {
				items.forEach((v,i) => {
					map[v.empId] = v.fData;
				});
				npmCache.put("formDataRecurring",map);
				defered.resolve();
			}
			else {
				npmCache.put("formDataRecurring",{});
				defered.resolve();
			}
		}
	});
  return defered.promise;
}


module.exports = {
	getDetailsCache:getDetailsCache,
	deleteCache:deleteCache,
	queryUsers:queryUsers,
	setKey:setKey,
	getHierarchy:getHierarchy,
	buildEmployeeMap:buildEmployeeMap,
	buildNestedMap:buildNestedMap,
	buildFormdataCache:buildFormdataCache,
	queryPublish:queryPublish,
	formStructureCache:formStructureCache,
	queryPublishRecurring:queryPublishRecurring,
	buildFormdataRecurringCache:buildFormdataRecurringCache,
	queryRole:queryRole
};
