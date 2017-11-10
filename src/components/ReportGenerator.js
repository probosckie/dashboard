import React, { Component } from 'react';
import SelectWrapper from './SelectWrapper';

import Form from 'react-jsonschema-form';
import axios from 'axios';


class ReportGenerator extends Component {
	constructor(){
		super();
		this.state = {
			reportType:'normal',
			formList:[],
			dataIndex:[],
			dropDownArray : [],
			topManagersUnderBu:null,
			hierarchy:null,
			employeeMap:null,
			submitting:false,
			formStructure:null,
			formPreview:null,
			reportNode:null,
			isBu:null,
			resultCsv:null,
			publishId:null
		}

		this.handleSelectChange = this.handleSelectChange.bind(this);
		this.initialize = this.initialize.bind(this);
		this.modifyValuesBelow = this.modifyValuesBelow.bind(this);
		this.findEveryoneBelow = this.findEveryoneBelow.bind(this);
		this.destroyDropdownsBelow = this.destroyDropdownsBelow.bind(this);
		this.sendData = this.sendData.bind(this);
		this.showFormSchema = this.showFormSchema.bind(this);


		this.changeReportType = this.changeReportType.bind(this); 
	}


	showFormSchema(){
		const { formStructure, uiMap, publishFormArray } = this.state;
		let publishId = null;

		let reportType = this.refs.reportType.value;
		let formId = this.refs.formId.value;

		if(reportType === 'recurring') {
			publishId = publishFormArray[this.refs.formId.selectedIndex].publishId;
		}

		let schema; 

		schema = formStructure[formId];

		let newUiSchema;
		if(schema.type === 'csv') {
			this.setState({
				publishId,
				formPreview:{
					type:'csv',
					title:schema.title
				}
			});
		} else {
			newUiSchema = uiMap[formId] || {};
			newUiSchema["ui:disabled"] = true;
			this.setState({
				publishId,
				formPreview:{
					schema:schema,
					type:'normal',
					uischema:newUiSchema
				}
			});
		}
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
		        checkboxState:null
					}
					dataIndex.push(valArray);
					dropDownArray.push(newM);
				}
				this.setState({dropDownArray:dropDownArray, dataIndex:dataIndex});
			}

			else {
				this.setState({dropDownArray:dropDownArray});
			}
		}
	}

	initialize(){
		const { topManagersUnderBu, dropDownArray, dataIndex, formList } = this.state;
		let keys = Object.keys(topManagersUnderBu);
		let x = {
        disabled:false,
        value:[],
        placeholder:'Select BU',
        options:null,
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
     }, () => this.showFormSchema());
	}

	

	sendData() {
		let payload = {};
		const { dropDownArray, formStructure, publishFormArray } = this.state;
		const { localPathAppend } = this.props;

		let formId = this.refs.formId.value;
				
		let index,i;
		let reportType = this.refs.reportType.value;

		if(dropDownArray[0].value.length > 0 && dropDownArray[0].value[0].length > 0){
			for (i=dropDownArray.length-1; i>=0; i--) {
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
		} else {
			payload.nodes = "everyone";
		}
			
	 
		payload.reportType = reportType;
		payload.formId = formId;
		payload.isCsv = (formStructure[formId].type === 'csv');

		if(reportType === 'recurring') {
			payload.publishId = publishFormArray[this.refs.formId.selectedIndex].publishId;
		}


		this.setState({
			dataIndex:[],
      dropDownArray : [],
      submitting:true,
		}, () => {
			axios.post(localPathAppend+'/generateReportCombineCsv', payload)
				.then((res) => {
					this.setState({
						submitting:false,
						resultCsv:res.data.fileName
					});
				})
				.catch((err) => {
					console.log(err);
				})
		})
	}

	changeReportType(e){
		const { formList } = this.state;
		let value = e.target.value;
		this.setState({reportType:e.target.value}, () => this.showFormSchema());
	}
	
	render(){
		const { formList, dropDownArray, submitting, formPreview, reportNode, employeeMap, isBu, formStructure, reportType, publishFormArray, resultCsv } = this.state;
		let formJsx, ddArrayJsx, previewJsx;

		let showPreview = !!formPreview;

		let { localPathAppend } = this.props;

		if(showPreview){
			if(formPreview.type === 'csv') {
				previewJsx = <span>This is a form of type csv <br/>Title: {formPreview.title} </span>
			} else 
				previewJsx = <Form schema={formPreview.schema} uiSchema={formPreview.uischema}>
				<button type="submit" class="hide">Submit</button>
			</Form>
		}

		if(!submitting){
			if(reportType === 'normal') {
				formJsx = formList.map((v,i) => {
					return <option key={i} value={v}>{formStructure[v].title}</option>
				});
			} else if (reportType === 'recurring'){
				formJsx = publishFormArray.map((v,i) => {
					return <option key={i} value={v.formId}>{v.recName}</option>
				});
			}
			

			ddArrayJsx = dropDownArray.map((v,i) => {
				return <SelectWrapper key={i} which={i} disabled={v.disabled} value={v.value} placeholder={v.placeholder} options={v.options} onC={this.handleSelectChange} shudContainCheckbox={false} onCheck={false} />
			});
		}
		

		return (<div class="container formHolder">

			{
				submitting && <span> <div class="loading"></div> Publishing Form...</span>
			}
			
			{
				!submitting && !resultCsv &&
				<span>
					
					<div>
						<label class="margin-top-10">Choose report form type</label> 
						<select class="form-control selectStyle" ref="reportType" onChange={this.changeReportType}>
							<option value="normal">Normal Reports</option>
							<option value="recurring">Recurring Form reports</option>
						</select>
					</div>

					<div>
						<label class="margin-top-10">Select form for report generation</label> 
						<select class="form-control selectStyle" ref="formId" onChange={this.showFormSchema}>
							{formJsx}
						</select>
					</div>


					{showPreview &&
						<span>
							<div class="preview">
								{previewJsx}
								<br/>
							</div>
						</span>
					}

					<br/>
					<div class="margin-bottom-15">
						<h3>Select node to generate a report:</h3>
					</div>

					{ddArrayJsx}

					<div class="margin-bottom-15">
						<button onClick={this.sendData} class="btn btn-default">Fetch Report</button>
					</div>
				</span>
			}

		

			{
				!submitting && !!resultCsv && <div>
					<form method="POST" action={localPathAppend+"/downloadReport"}>
						<div>
							<input name="reportName" value={resultCsv} class="hide" />
							<button class="btn btn-default">Download csv report</button>
						</div>
				  </form>

				</div>
			}
		</div>
		);
	}


	componentDidMount(){
		const { employeeMap, hierarchy, topManagersUnderBu, formStructure, publishFormMap } = this.props;
		let map ={}, uiMap = {};
		let formList = [];

		let x,publishFormArray = [];
    for (x in publishFormMap){
    	publishFormArray.push(publishFormMap[x]);
    }
		
		formStructure.forEach((v,i) => {
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
			formList:formList,
			dataIndex:[],
			dropDownArray : [],
			uiMap:uiMap,
			publishFormArray
		}, () => {
			this.initialize();
		});
	}

	componentWillReceiveProps(newProp) {
    const { employeeMap, hierarchy, topManagersUnderBu, formStructure, publishFormMap } = newProp;
    let map ={}, uiMap = {};
    let formList = [];
    let x,publishFormArray = [];
    for (x in publishFormMap){
    	publishFormArray.push(publishFormMap[x]);
    }

		formStructure.forEach((v,i) => {
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
			formList:formList,
			dataIndex:[],
			dropDownArray : [],
			uiMap:uiMap,
			publishFormArray
		}, () => {
			this.initialize();
		});
  }
}

export default ReportGenerator;