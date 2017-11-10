import React, { Component } from 'react';
import SelectWrapper from './SelectWrapper';
import Select from 'react-select';

import Form from 'react-jsonschema-form';


import axios from 'axios';



class HierarchySelect extends Component {
	constructor(){
		super();
		this.state = {
			everyone:false,
			formList:[],
			dataIndex:[],
			dropDownArray : [],
			topManagersUnderBu:null,
			hierarchy:null,
			employeeMap:null,
			additionalPeople:{
				options: [],
				value: []
			},
			submitting:false,
			formStructure:null,
			formPreview:null,
			isCsv:null,
			approval:true,
			timeControl:null
		}
		this.changeEveryone = this.changeEveryone.bind(this);
		this.handleSelectChange = this.handleSelectChange.bind(this);
		this.initialize = this.initialize.bind(this);
		this.toggleCheck = this.toggleCheck.bind(this);
		this.modifyValuesBelow = this.modifyValuesBelow.bind(this);
		this.findEveryoneBelow = this.findEveryoneBelow.bind(this);
		this.destroyDropdownsBelow = this.destroyDropdownsBelow.bind(this);
		this.initializeOtherPeople = this.initializeOtherPeople.bind(this);
		this.addOthers = this.addOthers.bind(this);
		this.sendData = this.sendData.bind(this);
		this.showFormSchema = this.showFormSchema.bind(this);
		this.handleChangeChk = this.handleChangeChk.bind(this);
		this.setFormTimeControl = this.setFormTimeControl.bind(this);
	}

	showFormSchema(e,k) {
		const { formStructure, uiMap } = this.state;
		let key = (e && e.target.value) || (k);
		let schema = formStructure[key];
		let newUiSchema = uiMap[key] || {};
		newUiSchema["ui:disabled"] = true;
		let isCsv = formStructure[key].type === 'csv';
		this.setState({
			formPreview:{
				schema:schema,
				uischema:newUiSchema,
			},
			isCsv:isCsv
		});
	}

	addOthers(value){
		const { additionalPeople } = this.state;
		additionalPeople.value = value;
		this.setState({additionalPeople});
	}

	changeEveryone(e){
		this.setState({
			everyone: e.target.checked
		});
	}

	destroyDropdownsBelow(n){
		const { dataIndex, dropDownArray } = this.state;
		dataIndex.length = n;
		dropDownArray.length = n;
		this.setState({
			dropDownArray, dataIndex
		});
	}

	findEveryoneBelow(x) {
		x = parseInt(x);
		const { hierarchy } = this.state;
		let i,buff = [];
		for (i in hierarchy) {
			if (hierarchy[i] === x)
				buff.push(i);
		}
		return buff;
	}


	handleSelectChange (value, which) {
		let test;
		const { dropDownArray } = this.state;
		dropDownArray[which].value = value.split(',');
		this.setState({ dropDownArray:dropDownArray });			
		this.modifyValuesBelow(value, which);
	}

	modifyValuesBelow(selected,which) {
		const { dropDownArray, topManagersUnderBu, hierarchy, employeeMap, dataIndex } = this.state;
		let doesExist = (dropDownArray[which + 1] !== undefined);
		let valueArray = selected.split(',');

		let maxLength = dataIndex.length;
		//destroy dropdowns from (which + 2 to max)
		if(maxLength > which+1)
		this.destroyDropdownsBelow(which+2);

		//populate immediate managers below BU level
		if(which === 0) {
			let i,allMgr = [],mapM, newM, target, valArray = [];
			for (i in topManagersUnderBu) {
				if(valueArray.indexOf(i) !== -1)
					allMgr = allMgr.concat(topManagersUnderBu[i])
			}

			mapM = allMgr.map((v,i) => {
				valArray.push(v);	
     		return { label: employeeMap[v].fullName, value:v.toString() }
     	});

			valArray = valArray.join(',');

			if(doesExist) {
				target = dropDownArray[1];
				target.options = mapM;
				dataIndex[1] = valArray;
				target.value = [];
			}
			else {
				newM = {
					disabled:false,
	        value:[],
	        placeholder:'Select Managers',
	        options:mapM,
	        shudContainCheckbox:true,
	        checkboxState:null
				}
				dataIndex.push(valArray);
				dropDownArray.push(newM);
			}
			this.setState({dropDownArray:dropDownArray, dataIndex:dataIndex});
		}
		else if (which > 0) {
			let i,allPeople = [],mapM, newM, target, valArray = [];
			
			valueArray.forEach((v,i) => {
				allPeople = allPeople.concat(this.findEveryoneBelow(v));
			});

			if(allPeople.length > 0) {
				
				mapM = allPeople.map((v,i) => {
					valArray.push(v);	
	     		return { label: employeeMap[v].fullName, value:v.toString() }
	     	});

				valArray = valArray.join(',');
				if(doesExist) {
					target = dropDownArray[which+1];
					target.options = mapM;
					dataIndex[which+1] = valArray;
					target.value = [];
				}
				else {
					newM = {
						disabled:false,
		        value:[],
		        placeholder:'Select Employees',
		        options:mapM,
		        shudContainCheckbox:true,
		        checkboxState:null
					}
					dataIndex.push(valArray);
					dropDownArray.push(newM);
				}
				this.setState({dropDownArray:dropDownArray, dataIndex:dataIndex});
			}

			else {
				dropDownArray[which].shudContainCheckbox = false;
				this.setState({dropDownArray:dropDownArray});
			}
		}
	}

	initialize(){
		const { topManagersUnderBu, dropDownArray, dataIndex } = this.state;
		let keys = Object.keys(topManagersUnderBu);
		let x = {
        disabled:false,
        value:[],
        placeholder:'Select BU',
        options:null,
        shudContainCheckbox:true,
        checkboxState:null
     };
     dataIndex.push(keys.join(','));
     x.options = keys.map((v,i) => {
     	return {
     		label:v,
     		value:v
     	}
     });

     dropDownArray.push(x);
     this.setState({
     	dropDownArray:dropDownArray,
     	dataIndex:dataIndex
     });
	}

	initializeOtherPeople(){
		const { employeeMap, additionalPeople } = this.state;
		let i,buff = [];
		for (i in employeeMap) {
			buff.push({value:i.toString(),label:employeeMap[i].fullName})
		}
		additionalPeople.options = buff;
		this.setState({additionalPeople});
	}

	toggleCheck(checked, which, all){
		const { dropDownArray } = this.state;
		let i;
		dropDownArray[which].checkboxState = checked;
		for (i=which+1; i<dropDownArray.length;i++) {
			dropDownArray[i].disabled = checked
		}
		if(all){
			dropDownArray[which].all = true;
		}
		this.setState({
			dropDownArray
		});
	}

	sendData(){
		const { everyone, dropDownArray, additionalPeople, isCsv, approval, timeControl } = this.state;
		const { reInitialize, localPathAppend } = this.props;
		let index, i, payload = {}, findFirstChild, onlySpecificSelect, url;
		let today = (new Date()).toDateString();
		
		onlySpecificSelect = (dropDownArray.findIndex(v => v.value.length>0) === -1);
		url = '/publishForm2';

		if(everyone) {
			payload.type = 'everyone';
		}

		else if (onlySpecificSelect) {
			payload.type = 'specific';
			payload.isBu = false;
			payload.extras = additionalPeople.value;
		}

		else {
			findFirstChild = dropDownArray.findIndex((v,i) => {
				return v.disabled;
			});
			if (findFirstChild !== -1) {
				findFirstChild = findFirstChild - 1;
				payload.type = (!!dropDownArray[findFirstChild].all) ? 'everyone-below':'immediate-child';
				payload.isBu = (findFirstChild === 0);
				payload.nodes = dropDownArray[findFirstChild].value;
			} 
			else {
				payload.type = "specific";
				for (i=dropDownArray.length-1; i>=0; i--){
					if(dropDownArray[i].value.length !== 0) {
						index = i;
						break;
					}
				}
				if (index === 0) {
					payload.isBu = true;
					payload.nodes = dropDownArray[index].value;
				}

				else {
					payload.nodes = dropDownArray[index].value;
				}
			}
			payload.extras = additionalPeople.value;
		}

		if (timeControl === 'expiry') {
			payload.expiry = (new Date(this.refs.expiryDate.value)).toDateString();
		} else if (timeControl === 'recurring') {
			url = '/publishFormRecurring';
			payload.expiryStart = (new Date(this.refs.recStart.value)).toDateString();
			payload.expiryEnd = (new Date(this.refs.recEnd.value)).toDateString();
			payload.recInterval = this.refs.recInterval.value;
			payload.recName = this.refs.recName.value;
		} else {
			payload.expiry = 'na';
		}
		payload.formId = this.refs.formId.value || this.state.loadImmediate;
		payload.requireApproval = approval;
		payload.isCsv = isCsv;
		payload.publishDate = today;
		this.setState({
			dataIndex:[],
      dropDownArray : [],
      additionalPeople:{
        options: [],
        value: []
      },
      submitting:true
		}, () => {
			axios.post(localPathAppend+url, payload)
				.then((res) => {
					reInitialize('normal');
				})
				.catch((err) => {
					console.log(err);
				})
		})
	}

	handleChangeChk(){
		this.setState({approval: !this.state.approval});
	}

	setFormTimeControl() {
		let val = this.refs.formTimeControl.value;
		this.setState({
			timeControl:val
		})
	}
	
	render() {
		const { formList, dropDownArray, additionalPeople, submitting, formPreview, isCsv, formStructure, approval, timeControl } = this.state;
		let formJsx, ddArrayJsx, previewJsx;


		let showPreview = !!formPreview;

		if(showPreview) {
			if(formPreview.schema.type === "object"){
				previewJsx = <Form schema={formPreview.schema} uiSchema={formPreview.uischema}>
					<button type="submit" class="hide">Submit</button>
				</Form>	
			} else if (formPreview.schema.type === "csv") {
				previewJsx = <span><p> Title: {formPreview.schema.title}</p>This is a form with csv files - People who recieve this file will fill it and push it back.</span>
			}
		}

		if(!submitting){
			formJsx = formList.map((v,i) => {
				return <option key={i} value={v}>{formStructure[v].title}</option>
			});

			ddArrayJsx = dropDownArray.map((v,i) => {
				return <SelectWrapper key={i} which={i} disabled={v.disabled} value={v.value} placeholder={v.placeholder} options={v.options} onC={this.handleSelectChange} shudContainCheckbox = {v.shudContainCheckbox} onCheck={this.toggleCheck} />
			});
		}
		

		return (<div class="container formHolder">

			{
				submitting && <span><div class="loading"></div> Publishing Form...</span>
			}
			
			{
				!submitting &&
				<span>
					<h3 class="margin-bottom-30">Select group of people and form to publish:</h3>
					<div class="margin-bottom-15">

					    <input ref="everyone" type='checkbox' id='checkbox-timeinc' class='form-control margin-top-10 notificationCheck pseudo-checkbox sr-only' onChange={this.changeEveryone}/>
					    <label for='checkbox-timeinc' class='fancy-checkbox-label'>
					        Send Form to everyone in Time Inc India
					    </label>
					</div>

					{ddArrayJsx}

					<br/>

					<div class="margin-bottom-15">	
						<label class='fancy-checkbox-label'>Select Individual Employees if any to Send Form:</label>
						<Select multi simpleValue disabled={false} value={additionalPeople.value} options={additionalPeople.options} placeholder="Choose Names" onChange={this.addOthers} />
					</div>

					<div>
						<label class="margin-top-10">Select Form :</label>
						<select class="form-control selectStyle" ref="formId" onChange={this.showFormSchema}>
							<option value="">Please select a form to publish</option>
							{formJsx}
						</select>
					</div>

					{showPreview && 
						<div>
							<h4 class="preview-title">Form Preview:</h4>
							<div class="preview">
								<span>Form Structure:</span>
								{previewJsx}
							</div>
						</div>
					}

					<div class="margin-bottom-15">
					    <input ref="approval" type='checkbox' id='checkbox-approval' defaultChecked={approval} class='form-control margin-top-10 notificationCheck sr-only small-checkbox' onChange={this.handleChangeChk}  />

					    <label for='checkbox-approval' class='fancy-checkbox-label approval-checkbox'>
					        Does Form require Approval ?
					    </label>
					</div>


					<div>
						<label class="margin-top-10">Choose Expiry or recurrence</label>
						<select class="form-control selectStyle" ref="formTimeControl" onChange={this.setFormTimeControl}>
							<option value="">Choose time control option</option>
							<option value="expiry">Set up Expiry Date</option>
							<option value="recurring">Setup up Form Recurring</option>
						</select>
					</div>
					
					{
						timeControl === 'expiry' && 
						<div class="margin-top-15">
							<label class="margin-top-10">Enter expiry date for the form</label>
							<input ref="expiryDate" type="date" class="form-control" />
						</div>
					}

					{
						timeControl === 'recurring' && 
						<div class="margin-top-15">

							<label class="margin-top-10">Name this recurring push</label>
							<input ref="recName" type="text" class="form-control" />

							<label class="margin-top-10">Choose Recurring start date</label>
							<input ref="recStart" type="date" class="form-control" />
							
							<label class="margin-top-10">Choose Recurring End date</label>
							<input ref="recEnd" type="date" class="form-control" />
							
							<label class="margin-top-10">Choose Recurring End date</label>
							<select class="form-control selectStyle" ref="recInterval">
								<option value="">Choose recurring option</option>
								<option value="everyday">every day from the start date</option>
								<option value="everyweek">every week (7 days) from the start date</option>
								<option value="monthly">Every month from start data</option>
								<option value="quarterly">Quarterly from start date</option>
								<option value="halfYearly">Half yearly from start date</option>
							</select>
						</div>
					}
			
					<div class="margin-top-15">
						<button onClick={this.sendData} class="btn btn-default">Send Notification</button>
					</div>

					
				</span>
			}
		</div>
		);
	}


	componentDidMount(){
		const { employeeMap, hierarchy, topManagersUnderBu, formStructure, loadImmediateForm } = this.props;
		let map ={}, uiMap = {};
		let formList = [];
		formStructure.filter(v => !v.archived).forEach((v,i) => {
			map[v.formId] = v.structure;
			uiMap[v.formId] = v.uiSchema;
			formList.push(v.formId);
		});

		this.setState({
			employeeMap: employeeMap,
			hierarchy: hierarchy,
			topManagersUnderBu:topManagersUnderBu,
			formStructure:map,
			uiMap:uiMap,
			formPreview:null,
			everyone:false,
			formList:formList,
			loadImmediate:loadImmediateForm,
			dataIndex:[],
			dropDownArray : [],
			timeControl:null,
			submitting:false
		}, () => {
			this.initialize();
			this.initializeOtherPeople();
			if(loadImmediateForm){
				this.showFormSchema(null,this.state.loadImmediate);
			}
		});

	}

	componentWillReceiveProps(newProp) {
    const { employeeMap, hierarchy, topManagersUnderBu, formStructure, loadImmediateForm } = newProp;
    let map ={}, uiMap = {};
    let formList = [];
		formStructure.filter(v => !v.archived).forEach((v,i) => {
			map[v.formId] = v.structure;
			uiMap[v.formId] = v.uiSchema;
			formList.push(v.formId);
		});
		this.setState({
			employeeMap: employeeMap, 
			hierarchy: hierarchy,
			topManagersUnderBu:topManagersUnderBu,
			formStructure:map,
			formPreview:null,
			uiMap:uiMap,
			everyone:false,
			formList:formList,
			loadImmediate:loadImmediateForm,
			dataIndex:[],
			dropDownArray : [],
			timeControl:null,
			submitting:false
		}, () => {
			this.initialize();
			this.initializeOtherPeople();
			if(loadImmediateForm){
				this.showFormSchema(null,this.state.loadImmediate);
			}
		});
  }
}

export default HierarchySelect;