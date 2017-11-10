import React, { Component } from 'react';
import CsvUpload from './CsvUploader';
import Navigation from './Navigation';
import Tree from './Tree';
import EmployeeForm from './EmployeeForm';

import multiSelect from './multiSelect';
import HierarchySelect from './HierarchySelect'
import DynamicForm from './DynamicForm';
import Approval from './Approvals';
import Reports from './Reports';
import DataUpload from './DataUpload';
import FormBuilder from './FormBuilder';
import ReportGenerator from './ReportGenerator';
import Profile from './Profile';
import UserRole from './UserRole';
import Tasks from './Tasks';
import SelectEmail from './SelectEmail';
import ViewForms from './ViewForms';
import Formtest from './Formtest';

import { BrowserRouter as Router, Route, Link, Redirect } from 'react-router-dom';
import axios from 'axios';
import _ from 'lodash';

const local = false;
const localPathAppend = local?'http://localhost:8001':'';

class Layout extends Component {
	constructor(){
		super();
		this.state = {
			/* GET /initialize */
			role:null,
			whichForm:null,
			email:null,
			empId:null,
			approvalForms:null,
			/*GET /getInitialData */
			initialData:null,
			/*GET /getFormStructures*/
			formStructure:null,
			/*GET /getUserData */
			userData:null,
			/*GET /getEmployeeMap */
			employeeMap: null,
			hierarchyMap: null,
			/*GET /getNestedMap */
			topManagersUnderBu:null,
			/*GET /getUserHierarchyData */
			hierarchy:null,
			toggleNotification: false,
			formInQuestion:null,
			loadImmediateForm:null,
			firstTime:false,
			defaultPath:null,
			expandWidth:true,
			recurForms:null,
			recurData:null,
			today:(new Date()).toDateString(),
			publishFormMap:null,
			roleMap:null
		}
		this.initialize = this.initialize.bind(this);
		this.getInitialData = this.getInitialData.bind(this);
		this.getFormStructure = this.getFormStructure.bind(this);
		this.getUserData = this.getUserData.bind(this);
		this.getEmployeeMap = this.getEmployeeMap.bind(this);
		this.getNestedMap = this.getNestedMap.bind(this);
		this.getHierarchy = this.getHierarchy.bind(this);
		this.getRecurPublish = this.getRecurPublish.bind(this);
		this.getRecurringData = this.getRecurringData.bind(this);
		this.showNotification = this.showNotification.bind(this);
		this.hideNotification = this.hideNotification.bind(this);
		this.togNotification = this.togNotification.bind(this);
		this.submitFile = this.submitFile.bind(this);
		this.getRole = this.getRole.bind(this);
		this.setEmailAndInitialize = this.setEmailAndInitialize.bind(this);
		this.nullEmail = this.nullEmail.bind(this);
		this.toggleExpandCollapse = this.toggleExpandCollapse.bind(this);
		this.getRoleMap = this.getRoleMap.bind(this);
		
		//Local versions of the getters
		this.getFormStructureLocal = this.getFormStructureLocal.bind(this);
		this.getInitialDataLocal = this.getInitialDataLocal.bind(this);
		this.getRecurringDataLocal = this.getRecurringDataLocal.bind(this);
		this.setRoleMapLocal = this.setRoleMapLocal.bind(this);
	}

	setEmailAndInitialize(e){
		this.setState({
			email:e,
			defaultPath:true
		}, () => {
			this.initialize();
		})
	}

	initialize(normal) {
		const { email } = this.state;
		this.setState({
			whichForm:null
		}, () => {
			axios.get(localPathAppend + '/initialize/'+email)
				.then((res) => {
					if(res.data.firstTime){
						this.setState({
							firstTime:res.data.firstTime,
							defaultPath:false,
							whichForm:[]
						});
					} else {
						let empId = res.data.empId;
						let whichForm = res.data.whichForm;
						let approvalForms = res.data.approvalForms;
						let recurForms = res.data.recurring;
						let publishFormMap = res.data.publishFormMap;
						if (normal === 'normal'){
							this.setState({
								whichForm,
								empId,
								approvalForms,
								recurForms,
								publishFormMap,
								toggleNotification:false,
								loadImmediateForm:null,
								firstTime:false,
								defaultPath:false
							});
						} else {
							//axios.all call here
							var p1 = axios.get(localPathAppend + '/getRole/'+empId);
							var p2 = axios.get(localPathAppend+'/getInitialData');
							var p3 = axios.get(localPathAppend+'/getFormStructures');
							var p4 = axios.get(localPathAppend+'/getUserData');
							var p5 = this.getEmployeeMap(true);
							var p6 = this.getNestedMap(true);
							var p7 = this.getHierarchy(true);
							var p8 = this.getRecurringData(true);
							var p9 = this.getRoleMap(true);

							axios.all([p1,p2,p3,p4,p5,p6,p7,p8,p9])
								.then(axios.spread((d1,d2,d3,d4,d5,d6,d7,d8,d9) => {
									var role = d1.data;
									var initialData = d2.data.initialData;
									var toggleNotification = false;
									let formStructure = _.sortBy(d3.data.formStructure, "formId");
									let loadImmediateForm = null;
									let userData = _.sortBy(d4.data,"empId");
									let employeeMap = d5.data.employeeMap;
									let hierarchyMap = d5.data.hierarchyMap;
									let topManagersUnderBu = d6.data;
									let hierarchy = _.sortBy(d7.data,"empId");
									let recurData = d8.data;
									let roleMap = d9.data;
									this.setState({
										role,
										initialData,
										toggleNotification,
										formStructure,
										loadImmediateForm,
										userData,
										employeeMap,
										hierarchyMap,
										topManagersUnderBu,
										hierarchy,
										recurData,
										empId,
										whichForm,
										approvalForms,
										recurForms,
										publishFormMap,
										roleMap,
										firstTime:false,
										defaultPath:false
									});
								}))
								.catch((err) => {
									console.log(err);
								})
						}		
					}
				})
				.catch((err) => {
					console.log(err);
				})
		});	
	}

	getRole(){
		const { empId } = this.state;
		axios.get(localPathAppend + '/getRole/'+empId)
			.then((res) => {
				this.setState({role:res.data});
			}, (err) => {
				console.log(err);
			});
	}

	getRoleMap(returnPromise) {
		if(returnPromise){
			return axios.get(localPathAppend + '/getRoleMap');
		}
		axios.get(localPathAppend + '/getRoleMap')
			.then((res) => {
				this.setState({
					roleMap:res.data
				})
			})
			.catch((err) => {
				console.log(err);
			})
	}

	setRoleMapLocal(payload,role){
		this.setState({
			roleMap:payload,
			role
		})
	}

	getInitialData(x) {
		this.setState({
			initialData:null
		}, () => {
			axios.get(localPathAppend+'/getInitialData')
			.then((res) => {
				this.setState({
					initialData:res.data.initialData,
					toggleNotification:false,
					formInQuestion:x
				});
			})
			.catch((err) => {
				console.log(err);
			})
		});
	}

	getInitialDataLocal(payload,x) {
		if(x){
			this.setState({
				initialData:payload,
				toggleNotification:false,
				formInQuestion:x
			});
		} else {
			this.setState({
				initialData:payload,
				toggleNotification:false
			});
		}
	}

	getRecurringData(returnPromise) {
		if(returnPromise){
			return axios.get(localPathAppend+'/getRecurringData');
		} else {
			this.setState({
				recurData:null
			}, () => {
				axios.get(localPathAppend+'/getRecurringData')
				.then((res) => {
					this.setState({
						recurData:res.data
					});
				})
				.catch((err) => {
					console.log(err);
				})	
			});
		}		
	}

	getRecurringDataLocal(payload){
		this.setState({
			recurData:payload
		});
	}

	getFormStructure(pushImmediate) {
		this.setState({
			formStructure:null
		}, () => {
			axios.get(localPathAppend+'/getFormStructures')
			.then((res) => {
				let temp = _.sortBy(res.data.formStructure, "formId");
				if(pushImmediate){
					this.setState({
						formStructure:temp,
						loadImmediateForm:pushImmediate
					});	
				} else {
					this.setState({
						formStructure:temp,
						loadImmediateForm:null
					});
				}
			})
			.catch((err) => {
				console.log(err);
			});
		});
	}

	getFormStructureLocal (pushImmediate, payload) {
		let temp = _.sortBy(payload, "formId");
		if(pushImmediate){
			this.setState({
				formStructure:temp,
				loadImmediateForm:pushImmediate
			});
		} else {
			this.setState({
				formStructure:temp,
				loadImmediateForm:null
			});
		}
	}

	getUserData() {
		axios.get(localPathAppend+'/getUserData')
			.then((res) => {
				let sorted = _.sortBy(res.data,"empId");
				this.setState({userData: sorted})
			},(err) => {
				console.log(err);
			});
	}

	getEmployeeMap(returnPromise) {
		if(returnPromise){
			return axios.get(localPathAppend+'/getEmployeeMap');
		} else {
			axios.get(localPathAppend+'/getEmployeeMap')
				.then((res) => {
					this.setState({employeeMap: res.data.employeeMap, hierarchyMap: res.data.hierarchyMap})
				},(err) => {
					console.log(err);
				});	
		}
	}

	getNestedMap(returnPromise) {
		if(returnPromise){
			return axios.get(localPathAppend+'/getNestedMap');
		} else {
			axios.get(localPathAppend+'/getNestedMap')
				.then((res) => {
					this.setState({topManagersUnderBu: res.data});
				},(err) => {
					console.log(err);
				});	
		}
	}


	getHierarchy(returnPromise) {
		if(returnPromise){
			return axios.get(localPathAppend+'/getUserHierarchyData');	
		} else {
			axios.get(localPathAppend+'/getUserHierarchyData').then((res) => {
				let sorted = _.sortBy(res.data,"empId");
				this.setState({
					hierarchy:sorted
				});
			},(err) => {
				console.log(err);
			});	
		}
	}

	getRecurPublish(){

	}

	showNotification(){
		this.setState({
			toggleNotification:true
		})
	}
	hideNotification(){
		this.setState({
			toggleNotification:false
		})
	}
	togNotification(){
		this.setState({
			toggleNotification: (!this.state.toggleNotification)
		})
	}

	nullEmail(){
		this.setState({
			email:null
		})
	}

	submitFile() {
		var data = new FormData();
		const { email } = this.state;
		var f2 = this.refs.fileData.files[0];
		data.append("data",f2);
		axios({
		  method:'post',
		  url: (localPathAppend+ "/postOrg"),
		  data: data,
		  headers: {
		    'Content-Type': 'multipart/form-data'
		  }
		}).then((res) => {
		  if(!email){
		    this.getUserData();
		  } else {
		    this.initialize(null);
		  }
		}).catch((err) => {
		  console.log(err);
		})
	}

	toggleExpandCollapse(){
		this.setState({
			expandWidth:(!this.state.expandWidth)
		})
	}

	render() {
		const { role, whichForm, email, empId, approvalForms, initialData, formStructure, userData, employeeMap, hierarchyMap, topManagersUnderBu, hierarchy, toggleNotification, formInQuestion, loadImmediateForm, defaultPath, expandWidth, recurForms, recurData, today, publishFormMap, roleMap } = this.state;

		const isAdmin = (role && role === 'admin');

		const loading = !(!!role && !!whichForm && !!email && !!empId && !!approvalForms && !!initialData && !!formStructure && !!userData && !!employeeMap && !!hierarchyMap && !!topManagersUnderBu && !!hierarchy && !!recurForms && !!recurData && !!publishFormMap && !!roleMap);

		const loadSetEmailUi = !email && userData && (userData.length > 0);

		let actionReqdCount = 0, temp,x,approvalsReqd = 0, recurringFormsCount = 0, totalActions = '', recurringFormsToFill;
		let recurShow, recurFormData, emps, empFormMap = {};

		const firstTime = (userData && (userData.length === 0) && !email);

		let personal, greeting='';

		if(firstTime) {
			greeting = email ? email.split('@')[0] : 'guest';
		}


		if(!loading) {
			temp = initialData[empId];
			if(!temp){
				actionReqdCount = whichForm.length;
			} else {
				for (x=0;x<whichForm.length;x++) {
					if(!(whichForm[x] in temp) || (whichForm[x] in temp && temp[whichForm[x]].approval==='not-approved'))
						actionReqdCount++;
				}
			}
			emps = Object.keys(initialData);
			emps.forEach((v,i) => {
				empFormMap[v] = Object.keys(initialData[v]);
			});

			approvalForms.forEach((v,i) => {
				if(v.empId in empFormMap && empFormMap[v.empId].indexOf(v.formId.toString()) !== -1 && initialData[v.empId][v.formId].approval==="sent-for-approval")
					approvalsReqd++;
			});

			recurFormData = recurData && empId && recurData[empId];
			recurShow = (recurForms && recurForms.length > 0);
			recurringFormsToFill = recurShow && recurForms.filter(v => {
				if(!recurFormData)
					return true;
				else if(recurFormData && !recurFormData[v.publishId])
					return true;
				else if(recurFormData && recurFormData[v.publishId] && !(today in recurFormData[v.publishId]))
					return true;
				else 
					return false;
			});
			recurringFormsCount = recurShow?recurringFormsToFill.length:0;
			actionReqdCount += recurringFormsCount;
			totalActions = actionReqdCount + approvalsReqd;
			personal = employeeMap[empId];
		}


		let expandStyle = expandWidth?{width:'23%'}:{width:'0%'};
		let expandStyleRight = expandWidth?{width:'75%'}:{width:'100%'};


		return <div class="outerDiv">
			
			{!loadSetEmailUi && loading && !firstTime && <span><div class="loading"></div> Loading Data...</span>}


			{loadSetEmailUi && <SelectEmail userData={userData} setEmailAndInitialize={this.setEmailAndInitialize} />}

			{!loading && !firstTime &&
				<Router>
					<div class="fl1">
						{loadImmediateForm && 
							<Redirect to="hierarchySelect" push />
						}

						{defaultPath && <Redirect to="/" push />}
					  <div class="top-header" >
					  	<span class="title-1">Welcome {employeeMap[empId].fullName}</span>
						  <div class="notification" onClick={this.togNotification}>
							  <a class="super-anchor"><span class="glyphicon glyphicon-bell"></span></a>
							  <span class="badge badge-notify">{totalActions}</span>
						  </div>
						  
						  <div class="replicate">
						  	<a class="super-anchor" onClick={this.nullEmail}>Switch User</a>
						  </div>
						  {toggleNotification && totalActions>0 &&
						  	<div class="floating-notification" onMouseOver={this.showNotification}>
						  			<ul class="minimal-list">
						  				{actionReqdCount > 0 && <li onClick={this.hideNotification}><Link to="userForm">You have {actionReqdCount} actions pending</Link></li>}
						  				{approvalsReqd > 0 && <li onClick={this.hideNotification}><Link to="approval">You have {approvalsReqd} approvals pending</Link></li>}
						  			</ul>
						 	 	</div>
							}
					  </div>
						
						<div class="center-content">
							<div class="left-profile" style={expandStyle}><Profile  name={personal.fullName} empId={empId} email={personal.email} directManager={personal.managerName} role={role} /></div>
							<div class="right-main-content" style={expandStyleRight}>
							   <button class="set-to-right glyphicon-menu-hamburger" onClick={this.toggleExpandCollapse}>{expandWidth?<span></span>:<span></span>}</button>
								{role && isAdmin && <Route path="/" exact render={() => <HierarchySelect employeeMap={employeeMap} hierarchy={hierarchyMap} topManagersUnderBu = {topManagersUnderBu} reInitialize={this.initialize} formStructure={formStructure} loadImmediateForm={loadImmediateForm} localPathAppend={localPathAppend} />} /> }
								{role && !isAdmin && <Route path="/" exact render={() => <EmployeeForm role={role} whichForm={whichForm} email={email} empId={empId} initialFormData={initialData} formStructure={formStructure}  reInitializeDataLocal={this.getInitialDataLocal} reInitializeRecurDataLocal={this.getRecurringDataLocal} empMap={employeeMap} formInQuestion={formInQuestion} localPathAppend={localPathAppend} recurringFormsToFill={recurringFormsToFill} recurShow={recurShow} publishFormMap={publishFormMap} /> } />}
								
								<Route path="/userdetail" render={() => <CsvUpload orgData={userData} localPathAppend={localPathAppend} />} />
			          <Route path="/orgTree" render={() => <Tree userData={userData} hierarchy={hierarchy} />} />
			          <Route path="/userForm" render={() => <EmployeeForm role={role} whichForm={whichForm} email={email} empId={empId} initialFormData={initialData} formStructure={formStructure}  reInitializeDataLocal={this.getInitialDataLocal} reInitializeRecurDataLocal={this.getRecurringDataLocal} empMap={employeeMap} formInQuestion={formInQuestion} localPathAppend={localPathAppend} recurringFormsToFill={recurringFormsToFill} recurShow={recurShow} publishFormMap={publishFormMap} /> }  />
			          <Route path="/dropDownTest" component={multiSelect} />
			          <Route path="/hierarchySelect" render={() => <HierarchySelect employeeMap={employeeMap} hierarchy={hierarchyMap} topManagersUnderBu = {topManagersUnderBu} reInitialize={this.initialize} formStructure={formStructure} loadImmediateForm={loadImmediateForm} localPathAppend={localPathAppend} />} />
			          <Route path="/dynamicform" exact render={() => <DynamicForm />}  />
			          <Route path="/approval" render={() => <Approval role={role} whichForm={whichForm} email={email} empId={empId} initialFormData={initialData} formStructure={formStructure} approvalForms={approvalForms} empMap={employeeMap} reInitializeDataLocal={this.getInitialDataLocal} setApprovalNumbers={this.setApprovalNumbers} localPathAppend={localPathAppend} /> } />
			          <Route path="/reports" render={() => <Reports empId={empId} initialFormData={initialData} formStructure={formStructure} empMap={employeeMap} recurFormData={recurFormData} publishFormMap={publishFormMap} />} />
			          <Route path="/uploadData" render={() => <DataUpload formStructure={formStructure} reInitializeDataLocal={this.getInitialDataLocal} reInitializeData={this.getInitialData} localPathAppend={localPathAppend} /> } />
			          
			          <Route path="/buildForm" render = {() => <FormBuilder requestFormStructureLocal={this.getFormStructureLocal} localPathAppend={localPathAppend} />} />
			          
			          <Route path="/nodeReport" render ={() => <ReportGenerator employeeMap={employeeMap} hierarchy={hierarchyMap} topManagersUnderBu = {topManagersUnderBu} formStructure={formStructure} localPathAppend={localPathAppend} publishFormMap={publishFormMap} /> } />
			          <Route path="/addRole" render = {() => <UserRole  employeeMap={employeeMap} localPathAppend={localPathAppend} roleMap={roleMap} empId={empId} setRoleMapLocal={this.setRoleMapLocal} /> } />
			          <Route path="/viewForm" render = {() => <ViewForms formStructure={formStructure} requestFormStructure={this.getFormStructure} requestFormStructureLocal={this.getFormStructureLocal} localPathAppend={localPathAppend} />} />
			          <Route path="/testform" render = {() => <Formtest />} />
			          

							</div>
						</div>
          </div>
				</Router>				
			}


			{firstTime && <div>
				<div class="top-header">
					<span>Hi {greeting}</span>
				</div>
				<div class="center-content">
					<div class="left-profile">
						something here
					</div>
					<div class="right-main-content">
						<div class="uploadSection container">
							This app is being used for the first time - please upload a valid set of userdetails to get started
							<form encType="multipart/form-data">
							  <div>
							     <span>Upload Data with CSV Template</span>
							       <input ref="fileData" type="file" name="org2" accept=".csv" class=""/>
							    <input type="button" value="Upload" onClick={this.submitFile} class="uploadFlie" />
							  </div>
							</form>

				  		<form method="POST" action={localPathAppend+"/downloadTemplate"} class="sampleCSV">
								<div>
									<span class="italic">Don't have CSV template? </span>
									<button class="downloadFlie">Download Here!</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>}

			<div id="copyrights">
		    <div class="container clearfix">
		        <div class="col_half">
		            <table class="st-a"><tbody><tr><td class="st-b"><a href="http://mytime.timeinc.net">Home</a></td><td class="st-b"><a href="mailto:corpcomm@timeinc.com">Contact Us</a></td><td class="st-c"><a href="http://emergency.mytime.timeinc.net/" target="_blank">Emergency Info</a></td></tr></tbody></table>              
		        </div>
		        <div class="col_half col_last tright">
		            © 2014 Time Inc. All Rights Reserved.             
		        </div>
		    </div>
			</div>
		</div>
	}

	componentDidMount() {
		const { email } = this.state;
		if(!email){
			this.getUserData();
		} else {
			this.initialize(null);
		}
	}
}

export default Layout;