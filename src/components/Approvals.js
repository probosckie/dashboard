import React, { Component } from 'react';
import axios from 'axios';
import Form from 'react-jsonschema-form';

import '!style-loader!css-loader!sass-loader!./../../scss/customStyle.scss';

import PlaindataGrid from './PlaindataGrid';


class Approval extends Component {
	constructor(){
		super();
		this.state = {
			role:null,
			whichForm:null,
			empId:null,
			approvalForms:null,
			initialFormData:null,
			finalApprovalObject:null,
			empMap:null,
			formStructure:null,
			uischema:{"ui:disabled": true},
			approvalSchemas:[],
			submitting:false,
			approvalShortSchemas:[]
		};
		this.initFilledFormData = this.initFilledFormData.bind(this);
		this.showApprovalForms = this.showApprovalForms.bind(this);
		this.approveRequest = this.approveRequest.bind(this);
		this.showApproval = this.showApproval.bind(this);
	}


	initFilledFormData() {
		const { initialFormData, approvalForms, formStructure } = this.state;
		let empFormMap = {};
		let finalApproval = [];
		let emps;
		if (!!initialFormData && !!approvalForms) {
			emps = Object.keys(initialFormData);
			emps.forEach((v,i) => {
				empFormMap[v] = Object.keys(initialFormData[v]);
			});
			approvalForms.forEach((v,i) => {
				if(v.empId in empFormMap && empFormMap[v.empId].indexOf(v.formId.toString()) !== -1) {
					finalApproval.push({
						empId:v.empId,
						formId:v.formId,
						data:initialFormData[v.empId][v.formId],
					});
				}
			})
			this.setState({
				finalApprovalObject:finalApproval
			}, () => {
				this.showApprovalForms();
			});
		}
	}


	showApprovalForms(){
		const { finalApprovalObject, empMap, formStructure, uischema, uiMap } = this.state;
		let finalShort =[];
		let map = [];
		let temp, temp2, temp3;
		if( !!finalApprovalObject && !!empMap && !!formStructure) {
			finalApprovalObject.forEach((v,i) => {
				temp = {};
				temp3 = {};
				temp.empName = empMap[v.empId].fullName;
				temp.formId = v.formId;
				temp.empId = v.empId;
				temp.uischema = uiMap[v.formId];
				if(temp.uischema)
					temp.uischema["ui:disabled"] = true;
				temp2 = formStructure[v.formId];
				if(temp2.type !== 'csv'){
					temp2.properties.userComment = {
						type:"string",
						default:"",
						title:"User Comment"
					};
					if(temp.uischema["ui:order"].indexOf('userComment') === -1)
						temp.uischema["ui:order"].push('userComment')
					temp.csv = false;
				} else {
					temp.csv = true;
				}
				temp3.empName = empMap[v.empId].fullName;
				temp3.title = formStructure[v.formId].title;
				temp3.index = i;
				temp.index = i;
				temp.schema = temp2;
				temp.formData = v.data;

				if(v.data.approval === 'sent-for-approval'){
					finalShort.push(temp3);
					map.push(temp);
				}
			});
			this.setState({
				approvalSchemas:map,
				approvalShortSchemas:finalShort
			})
		}
	}

	approveRequest(i,requestApproved){
		let payload = {};
		const { approvalSchemas, empId } = this.state;
		let { reInitializeDataLocal , localPathAppend } = this.props;
		payload.empId = approvalSchemas[i].empId;
		payload.formId = approvalSchemas[i].formId;
		payload.approvalStatus = requestApproved?'approved':'not-approved';
		payload.approver = empId;
		let approverComment = document.querySelector('.approverComment');
		if(approverComment.value !== ''){
			payload.approverComment = approverComment.value
		}
		this.setState({
			submitting:true
		}, () => {
			axios.post(localPathAppend+'/updateApproval', payload)
				.then((res) => {
					reInitializeDataLocal(res.data.payload);
				})
				.catch((err) => {
					console.log(err);
				})
		});	
	}

	showApproval(n){
		let target = this.refs["app-"+n];
		let all = document.querySelectorAll('.all-approval');
		[].map.call(all,(e) => e.classList.add('hide'));
		target.classList.remove('hide');
	}

	render(){
		const { approvalSchemas, submitting, approvalShortSchemas } = this.state;
		let showApproval = (approvalSchemas.length !== 0);
		let formJsx, liJsx;
		if (showApproval) {
			formJsx = approvalSchemas.map((v,i) => {
				return <div key={i} ref={"app-"+v.index} class="margin-top-20 section-approval hide all-approval approve-form-preview preview">
						<div>Please approve the form filled by <span><strong>{v.empName}</strong></span></div>
						<br/>
						{!v.csv && <Form schema={v.schema} formData={v.formData} uiSchema={v.uischema}>
							 <button type="submit" class="hide">Submit</button>
						</Form>}
						{v.csv && <div>
							<PlaindataGrid data={v.formData.data} headers={v.formData.headers} />
						</div>}
						<label class="control-label">Approver Comment</label><br/>
						<textarea class="form-control margin-bottom-30 approverComment"></textarea><br/>
						<button class="btn-success margin-right-15" onClick={() => this.approveRequest(i,true)}>Approve</button>
						<button class="btn-danger" onClick={() => this.approveRequest(i,false)}>Reject</button>
				</div>
			});
			liJsx = approvalShortSchemas.map((v,i) => {
					return <li key={i} onClick={() => this.showApproval(v.index)}>{v.title} by {v.empName}</li>
				});
		}
		return <div>
			
			{submitting && 
					<span><div class="loading"></div> Updating Form Approval...</span>
			}
			{showApproval && !submitting && <div class="container min-height-300">
				<h4>Please click on the forms to Approve:</h4>
				<div class="contain-left-50 approve-form-list">
					<ul class="clean-list forms-list">
						{liJsx}
					</ul>
				</div>
				<div class="contain-right-50 padding-bottom-19">
					{formJsx}
				</div>
				
			</div>}
		</div>
	}

	componentDidMount(){
		const { role, whichForm, empId, initialFormData, formStructure, approvalForms, empMap } = this.props;
		let map ={}, uiMap = {};
		formStructure.forEach((v,i) => {
			map[v.formId] = v.structure;
			uiMap[v.formId] = v.uiSchema;
		});
		this.setState({
			role:role, 
			whichForm:whichForm, 
			empId:empId, 
			initialFormData:initialFormData, 
			formStructure:map, 
			approvalForms:approvalForms, 
			empMap:empMap,
			submitting:false,
			uiMap
		}, () => {
			this.initFilledFormData();
		});
	}

	componentWillReceiveProps(newProp){
		const { role, whichForm, empId, initialFormData, formStructure, approvalForms, empMap } = newProp;
		let map ={}, uiMap = {};
		formStructure.forEach((v,i) => {
			map[v.formId] = v.structure;
			uiMap[v.formId] = v.uiSchema;
		});
		this.setState({
			role:role, 
			whichForm:whichForm,
			empId:empId, 
			initialFormData:initialFormData, 
			formStructure:map, 
			approvalForms:approvalForms, 
			empMap:empMap,
			submitting:false,
			uiMap
		}, () => {
			this.initFilledFormData();
		}); 
  }
}


export default Approval;
