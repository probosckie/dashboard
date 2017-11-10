import React, { Component } from 'react';
import axios from 'axios';
import Form from 'react-jsonschema-form';

class EmployeeForm extends Component {
	constructor(){
		super();
		this.state = {
			role:null,
			whichForm:null,
			formStructure:null,
			empId:null,
			formDisplay:null,
			initialFormData:null,
			submitting:false,
			empMap:null,
			today:null,
			recurringform:null,
			publishId:null,
			publishFormMap:null
		};
		this.loadForm = this.loadForm.bind(this);
		this.loadRecurring = this.loadRecurring.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.submitFile = this.submitFile.bind(this);
	}


	loadForm(e,k) {
		const key = k || parseInt(e.target.value);
		const { formStructure, empId, initialFormData, empMap, uiMap } = this.state;

		let csvApproval, showCsv, csvMessage;

		let temp,temp2 = {}, temp3, target;

		if(!!formStructure) {
			temp = initialFormData[empId];
			/*check for a csv form*/
			target = formStructure.filter((v,i) => {
				return (v.formId == key);
			});
			if (target[0].structure.type === "csv") {
				if(temp && temp[key] && temp[key].approval){
					csvApproval = temp[key].approval;
					if(csvApproval === 'approved'){
						showCsv = false;
						csvMessage = "Your csv form has already been approved. It will be listed under previous forms section button on top";
					} else if (csvApproval === 'sent-for-approval') {
						showCsv = false;
						csvMessage = "Your csv form has been sent for approval.";						
					} else if (csvApproval === 'not-approved'){
						showCsv = true;
						csvMessage = "Your csv form has rejected by "+ empMap[temp[key].approver].fullName +".\n Comment: "+temp[key].approverComment+"\n Please download the template and fill it again";
					} else if (csvApproval === 'not-needed') {
						showCsv = false;
						csvMessage = "Since this form does not require an approval - your csv data has been saved directly"
					}
				} else{
					showCsv = true;
					csvMessage = '';
				}

				this.setState({
						csvDisplay: target[0].structure,
						formDisplay: null,
						selectedFormIndex:key,
						showCsv:showCsv,
						csvMessage:csvMessage,
						description:target[0].description,
						recurringform:false
				});
			}
			else {
				if(temp && temp[key] && temp[key].approval === 'approved') {
					temp3 = empMap[temp[key].approver].fullName;
					temp2.plain = true;	
					temp2.text = 'Your Form has already been approved by '+temp3;
					this.setState({
						formDisplay:null,
						csvDisplay:null,
						recurringform:false
					});
				}
				else if (temp && temp[key] && temp[key].approval === 'sent-for-approval') {
					temp2.plain = true;
					temp2.text = 'Your form has been filled and sent for approval';
					this.setState({
						formDisplay:null,
						csvDisplay:null,
						recurringform:false
					});		
				} 
				else if (temp && temp[key] && temp[key].approval === 'not-needed') {
					temp2.plain = true;	
					temp2.text = 'Since this form does not require an approval - form data has been saved directly';
					this.setState({
						formDisplay:null,
						csvDisplay:null,
						recurringform:false
					});
				} else {
					/*maybe he is filling the form for the first time*/
					const jsx = target[0].structure;
					if (temp && temp[key] && temp[key].approval === 'not-approved') {
						temp3 = empMap[temp[key].approver].fullName;
						jsx.plain = false;
						jsx.text = 'Form rejected by '+temp3+'\n Comment: '+temp[key].approverComment+'\n\n';
						jsx.data = temp[key];
					}
					this.setState({
						formDisplay:jsx,
						selectedFormIndex:key,
						csvDisplay:null,
						description:target[0].description,
						uiSchema: {...target[0].uiSchema, "ui:disabled":false},
						recurringform:false
					});
				}
			}	
		}
	}

	loadRecurring(key) {
		const { formStructure, empId, empMap, uiMap } = this.state;
		let publishId = key.publishId, formId = key.formId;
		let target;
		if(!!formStructure) {
			/*check for a csv form*/
			target = formStructure.filter((v,i) => {
				return (v.formId == formId);
			});
			if (target[0].structure.type === "csv") {
				this.setState({
					csvDisplay: target[0].structure,
					formDisplay: null,
					selectedFormIndex:formId,
					publishId:publishId,
					showCsv:true,
					description:target[0].description,
					recurringform:true
				});
			}
			else {
				const jsx = target[0].structure;
				this.setState({
					formDisplay:jsx,
					selectedFormIndex:formId,
					publishId:publishId,
					csvDisplay:null,
					description:target[0].description,
					uiSchema:{...target[0].uiSchema, "ui:disabled":false},
					recurringform:true
				});
			}	
		}
	}


	handleSubmit({ formData }) {
		const { empId, selectedFormIndex, recurringform, publishId, today } = this.state;
		let payload = {}, i, url = '/updateFormdata';
		let  { localPathAppend, reInitializeRecurDataLocal, reInitializeDataLocal } = this.props;
		payload.empId = empId;
		payload.formId = selectedFormIndex;
		for (i in formData){
			if(!formData[i]){
				formData[i] = ' ';
			}
		}
		payload.data = formData;

		if (recurringform) {
			payload.publishId = publishId;
			payload.dateString = today;
			url = '/updateFormdataRecurring';	
		}

		if(selectedFormIndex){
			this.setState({
				submitting:true,
				formDisplay:null
			}, () => {
				axios.post(localPathAppend+url, payload)
					.then((res) => {
						if(recurringform)
							reInitializeRecurDataLocal(res.data.payload);
						else 
							reInitializeDataLocal(res.data.payload,selectedFormIndex);
					})
					.catch((err) => {
						console.log(err);
					})
			});	
		}
	}

	submitFile() {
		const { recurringform, publishId, today, selectedFormIndex, empId } = this.state;
		var data = new FormData();
		var f2 = this.refs.fileData.files[0];
		const { localPathAppend, reInitializeDataLocal, reInitializeRecurDataLocal } = this.props;
		data.append("data",f2);
		if(selectedFormIndex && !recurringform) {
			axios({method:'post', url:(localPathAppend+ "/postCsvTemplateData/"+selectedFormIndex+'/'+empId), data:data, headers: { 'Content-Type': 'multipart/form-data'}})
				.then((res) => {
			  	reInitializeDataLocal(res.data.payload,selectedFormIndex);
				})
				.catch((err) => {
			  	console.log(err);
				})
		} else if (selectedFormIndex && recurringform) {	
			axios({ method:'post', url:(localPathAppend+ "/postCsvTemplateDataRecurring/"+publishId+'/'+empId+'/'+today), data:data, headers: { 'Content-Type': 'multipart/form-data' }})
				.then((res) => {
			  	reInitializeRecurDataLocal(res.data.payload)
				})
				.catch((err) => {
			  	console.log(err);
				})
		}
	}

	render() {
		const { role, whichForm, empId, formDisplay, submitting, csvDisplay, csvMessage, showCsv, formMap, initialFormData, uiSchema, description, today } = this.state;
		const { localPathAppend, recurringFormsToFill, recurShow } = this.props;
		let showStuff = ((whichForm && whichForm.length > 0) || (recurShow && recurringFormsToFill.length>0));
		let normalForm = (whichForm && whichForm.length > 0);
		let formStAvailable = !!formDisplay && formDisplay.type !== 'csv';
		let formData = initialFormData && empId && initialFormData[empId];
		
		/*pushing comments*/
		if (formStAvailable && !formDisplay.plain) {
			formDisplay.properties.userComment = {
				type:"string",
				default:"",
				title:"User Comment"
			}
			if(uiSchema["ui:order"].indexOf('userComment') === -1)
				uiSchema["ui:order"].push('userComment');
		}

		let csvView = !!csvDisplay;

		let formLinkJsx = normalForm && whichForm.filter(v => {
			if(!formData)
				return true;
			else if (formData && !formData[v])
				return true;
			else if (formData && formData[v] && (formData[v].approval !== 'approved' && formData[v].approval !== 'sent-for-approval' && formData[v].approval !== 'not-needed'))
				return true;
		}).map((v,i) => <li key={i} onClick={() => this.loadForm(null,v)}>{formMap[v].title}</li>);



		let recurLinkJSX = recurShow && formMap && recurringFormsToFill.map((v,i) => { 
			return <li key={i} onClick={() => this.loadRecurring(v)}>{formMap[v.formId].title} - by recurring publish# {v.publishId}</li>
		});
			



		return (<div>
			{showStuff && <div class="container min-height-300">
				<h4>Please Click on the Form Names to Open and Fill Data:</h4>
				<div class="form-contain-left">
					Normal Forms
					<ul class="clean-list forms-list">
						{formLinkJsx}
					</ul>


					{recurringFormsToFill.length>0 && <span>Recurring Forms</span>}
					<ul class="clean-list forms-list">
						{recurLinkJSX}
					</ul>
				</div>

				<div class="form-contain-right">
				{submitting && 
					<span><div class="loading"></div> Pushing Data...</span>
				}


				{!submitting && formStAvailable &&
					<div class="preview">
					{formDisplay.text && <span class="display-linebreak">{formDisplay.text}</span>}

					{description && <div>{description}</div>}
					{!formDisplay.plain && formDisplay.data  && 
						<Form schema={formDisplay} onSubmit={this.handleSubmit} uiSchema={uiSchema||{}} formData={formDisplay.data} onError={() => console.log('error')} />
					}

					{!formDisplay.plain && !formDisplay.data  &&
						<Form schema={formDisplay} onSubmit={this.handleSubmit} uiSchema={uiSchema||{}} onError={() => console.log('error')} />
					}
					</div>
				}

				{!submitting && csvView && <div>
					  <p class="display-linebreak">{csvMessage}</p>
					  {showCsv && 
					  	<div>
						  	<form method="POST" action={localPathAppend+"/downloadTemplateIndex"}>
									<div>
										<span class="italic">Download csv template from here</span>
										<input name="templateName" value={csvDisplay.csvTemplateName} class="hide" />
										<button class="downloadFlie">Download Template</button>
									</div>
							  </form>
							  

							  <form encType="multipart/form-data">
								  <div>
								     <span>Upload Data with CSV Template</span>
								      <input ref="fileData" type="file" name="templateForm" accept=".csv" class=""/>
								    <input type="button" value="Upload" onClick={this.submitFile} class="uploadFlie" />
								  </div>
								</form>
						  </div>
						}
					  </div>
				}
				</div>
			</div>
			}
		</div>);
	}

	componentDidMount() {
		const { role, whichForm, formStructure, empId, initialFormData, empMap, formInQuestion, recurringFormsToFill, recurShow, publishFormMap } = this.props;
		
		let map ={};

		formStructure.forEach((v,i) => {
			map[v.formId] = v.structure;
		});

		this.setState({
			role: role, 
			whichForm:whichForm, 
			formStructure:formStructure, 
			empId:empId, 
			initialFormData:initialFormData,
			submitting:false,
			empMap:empMap,
			selectedFormIndex:formInQuestion,
			formMap:map,
			today: (new Date()).toDateString(),
			recurringFormsToFill:recurringFormsToFill,
			recurShow:recurShow,
			publishFormMap:publishFormMap
		}, () => {
			if(formInQuestion)
				this.loadForm(null, formInQuestion);
		});
	}

	componentWillReceiveProps(newProp){
    const { role, whichForm, formStructure, empId, initialFormData, empMap, formInQuestion, recurringFormsToFill, recurShow, publishFormMap } = newProp;
    
    let map ={};

		formStructure.forEach((v,i) => {
			map[v.formId] = v.structure;
		});

		this.setState({
			role: role, 
			whichForm:whichForm, 
			formStructure:formStructure,
			empId:empId, 
			initialFormData:initialFormData,
			submitting:false,
			empMap:empMap,
			selectedFormIndex:formInQuestion,
			formMap:map,
			today: (new Date()).toDateString(),
			recurringFormsToFill:recurringFormsToFill,
			recurShow:recurShow,
			publishFormMap:publishFormMap 
		}, () => {
			if(formInQuestion)
				this.loadForm(null, formInQuestion);
		});
  }
}

export default EmployeeForm;
