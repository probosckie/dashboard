import React, { Component } from 'react';
import axios from 'axios';

import SetListDetails from './SetListDetails';


class FormBuilder extends Component {
	constructor(){
		super();
		this.state = {
			fieldArray : [],
			fieldArrayType: [],
			fieldLabelList:{},
			current:0,
			visibilityField:[],
			submitting:false,
			formType:"normal",
			error:""
		};
		this.addField = this.addField.bind(this);
		this.saveForm = this.saveForm.bind(this);
		this.changeFormType = this.changeFormType.bind(this);
		this.submitFile = this.submitFile.bind(this);
		this.setSpecialFields = this.setSpecialFields.bind(this);
		this.setFieldLabelList = this.setFieldLabelList.bind(this);
		this.removeField = this.removeField.bind(this);
	}

	addField() {
		let { current, fieldArray, fieldArrayType, visibilityField } = this.state;
		current = current + 1;
		fieldArray.push(current);
		fieldArrayType.push(current);
		visibilityField.push(true)
		this.setState({
			current,fieldArray, fieldArrayType, visibilityField
		});
	}
	removeField(i){
		let { visibilityField } = this.state;
		visibilityField[i] = false;
		this.setState({visibilityField});
	}

	saveForm(){
		const { fieldArray, fieldArrayType, fieldLabelList, visibilityField } = this.state;
		let payload = {};
		let schema = {};
		let requiredSchema = [];
		let { requestFormStructureLocal, localPathAppend } = this.props;
		let loadImmediate, uiSchema = {"ui:order":[]}, returnPayload;
		let formName = this.refs.formName.value;
		payload.formName = formName;
		payload.description = this.refs.formDesc.value || ' ';
		payload.structure = {};
		payload.structure.title = formName;
		payload.structure.type = "object";
		fieldArray.forEach((v,i) => {
			if(visibilityField[i]){
				let cache = this.refs["type"+i];
				let labelCache = this.refs["label"+i];
				let name = labelCache.value;

				if(fieldArrayType[i] === 'checkbox' || fieldArrayType[i] === 'radiobutton') {
					let nameProduced = 'checkbox' + i;
					if(fieldArrayType[i] === 'checkbox') {
						schema[nameProduced] = {
							type: "array",
							title: labelCache.value,
							items: {
		            type: "string",
		            enum: fieldLabelList[i],
		          },
		          uniqueItems: true
						}
						uiSchema[nameProduced] = {
							"ui:widget": "checkboxes"
						};
						if(this.refs["required"+i].checked) {
							requiredSchema.push(nameProduced);
						}
					} else if (fieldArrayType[i] === 'radiobutton') {
						let nameProducedInner = nameProduced+"2";
						schema[nameProduced] = {
							type:"object",
							title:" ",
							"required": [nameProducedInner],
							"properties": {
				        [nameProducedInner]: {
				          "type": "string",
				          "title": labelCache.value,
				          "enum": fieldLabelList[i]
				        }
				      }
						}
						uiSchema[nameProduced] = {
							[nameProducedInner]:{
								"ui:widget": "radio"
							}
						};
					}
					uiSchema["ui:order"].push(nameProduced);
				} else {
					if(this.refs["required"+i].checked){
						requiredSchema.push(name);
					}
					
					uiSchema["ui:order"].push(name);

					if (cache.options[cache.selectedIndex].text === 'Textarea') {
						uiSchema[name] = {
							"ui:widget": "textarea"
						}
					}
					schema[name] = {
						type:cache.value,
						title:labelCache.value
					};	
				}		
			}
					
		});
		payload.structure.properties = schema;
		payload.structure.required = requiredSchema;
		payload.immediatePush = this.refs.pushImmediate.checked;
		payload.uiSchema = uiSchema;
		if(formName !== '') {
			this.setState({
				submitting:true,
				error:''
			}, () => {
				axios.post(localPathAppend+'/setFormStructure', payload)
				  .then((res) => {
						loadImmediate = res.data.pushImmediate;
						returnPayload = res.data.payload;
						//this.refs.formName.value = "";
						if(payload.immediatePush)
							requestFormStructureLocal(loadImmediate,returnPayload);
						else 
							requestFormStructureLocal(false,returnPayload);
					})
					.catch((err) => {
						console.log(err);
					});	
			});	
		} else {
			this.setState({
				error:'ERROR: Formname cannot be blank'
			});
		}
	}

	changeFormType(e){
		this.setState({
			formType:e.target.value
		})
	}

	submitFile() {
		const { formStructure, localPathAppend, requestFormStructureLocal } = this.props;
		let data = new FormData();
		let f2 = this.refs.dataUpload.files[0];
		let returnPayload;
		data.append("data",f2);
		let formTitle = this.refs.formName.value;
		if(formTitle !== ''){
			this.setState({
				submitting:true,
				error:''
			}, () => {
				axios({
				  method:'post',
				  url: (localPathAppend+"/publishCsvForm/"+formTitle),
				  data: data,
				  headers: {
				    'Content-Type': 'multipart/form-data'
				  }
				}).then((res) => {
				  returnPayload = res.data.payload;
				  	requestFormStructureLocal(false,returnPayload);
					})
					.catch((err) => {
				  	console.log(err);
					})
			});
		} else {
			this.setState({
				error:'ERROR: Formname cannot be blank'
			});
		}
	}

	setSpecialFields(i){
		const { fieldArrayType } = this.state;
		const val = this.refs["type"+i].value;
		if (val === 'checkbox' || val === 'radiobutton') {
			fieldArrayType[i] = val;
			this.setState({fieldArrayType});
		}
	}


	setFieldLabelList(str,i) {
		const { fieldLabelList } = this.state;
		fieldLabelList[i] = str;
		this.setState({
			fieldLabelList
		});
	}


	render(){
		const { fieldArray, submitting, formType, fieldArrayType, error, visibilityField } = this.state;
		let fieldJsx;
		let showFields = fieldArray.length !== 0;
		let isCsv = (formType === 'csv');
		if (showFields) {
			fieldJsx = fieldArray.map((v,i) => {
				let classString, isVisible = visibilityField[i];
				if(!isVisible)
					classString = 'margin-top-20 new-fields-section hide';
				else 
					classString = 'margin-top-20 new-fields-section'
				return <div key={i} class={classString}>
					<label>Enter field Label: </label>
					<span class="glyphicon glyphicon-remove" onClick={() => this.removeField(i)}></span>
					<input type="text" ref={"label"+i} class="form-control input-width"/> <br/>

					<label>Select Field type: </label>
					<select ref={"type"+i} class="form-control select-width" onChange={() => this.setSpecialFields(i)}>
						<option value="string">Textfield</option>
						<option value="string">Textarea</option>
						<option value="number">Number</option>
						<option value="checkbox">Checkbox Set</option>
						<option value="radiobutton">Radio Button Set</option>
					</select> <br/>
					
					{fieldArrayType[i] === 'radiobutton' && <div class='radiobtndetails'>
						<SetListDetails type="radio-button-list" index={i} passLabel={(str,i) => this.setFieldLabelList(str,i)}/>
					</div>}

					{fieldArrayType[i] === 'checkbox' && <div class='checkboxdetails'>
						<SetListDetails type="checkbox-list" index={i} passLabel={(str,i) => this.setFieldLabelList(str,i)}/>
					</div>}

					<label class="checkbox-lable">Is field Required: </label>
					  <input type="checkbox" ref={"required"+i} class="margin-left-39 checkbox-style" />
				</div>;
			});
		}
		return <div>
		  {submitting && 
					<span><div class="loading"></div> Saving form to Database...</span>
			}
			{!submitting && <div>

				<h2>Create forms</h2>

				{!!error && <span>{error}<br/></span>}
				
				<label>Enter name of form:</label>
				<input type="text" ref="formName" class="form-control input-width" />
				<br/>
				<label>Enter form description or instruction for filling</label>
				<input type="text" ref="formDesc" class="form-control input-width" />
				<br/>

				<label>Normal form / Csv form ?</label>
				<select ref="formType" onChange={this.changeFormType} class="form-control select-width">
					<option value="normal">Normal fields</option>
					<option value="csv">CSV file upload</option>
				</select>

				<br/>

				<label class="checkbox-lable">Push Form Immediately after creation:</label>
				<input type="checkbox" ref="pushImmediate" class="margin-left-10 checkbox-style" />

				<br/>
				{showFields && !isCsv && fieldJsx}
				<br/>
				{!isCsv && <button class="btn btn-default" onClick={this.addField}>Add Fields</button>}
				{showFields && !isCsv && <button class="btn btn-default" onClick={this.saveForm}>Save form to database</button>}

				{isCsv && <div>
					<form encType="multipart/form-data">
					  <div>
					     <span>Upload csv template to be used as form data template</span>
					    <label class="btn btn-default btn-file browseFile">
					      Browse <input ref="dataUpload" type="file" name="org2" accept=".csv" class="hideButton"/>
					    </label>
					    <input type="button" value="Save Form to Database" onClick={this.submitFile} class="uploadFlie" />
					  </div>
					</form>
				</div>}

			</div>}
		</div>;
	}

	componentDidMount(){
		this.setState({
			submitting:false,
			fieldArray:[],
			current:0,
			formType:"normal",
			fieldArrayType: [],
			fieldLabelList:{}
		});
	}

	componentWillReceiveProps(){
		this.setState({
			submitting:false,
			fieldArray:[],
			current:0,
			formType:"normal",
			fieldArrayType: [],
			fieldLabelList:{}
		});
	}
}


export default FormBuilder;