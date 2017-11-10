import React, { Component } from 'react';
import Form from 'react-jsonschema-form';

import axios from 'axios';


class DataUpload extends Component {
	constructor(){
		super();
		this.state = {
			formId:[],
			formStructure:null,
			formPreview:null,
			submitting:false
		}
		this.loadForm = this.loadForm.bind(this);
		this.submitFile  = this.submitFile.bind(this);
	}

	loadForm(e,index){
		let key = index || e.target.value;
		const { formStructure, uiMap } = this.state;
		let newUiSchema = uiMap[key] || {};
		newUiSchema["ui:disabled"] = true;
		if(e.target.value) {
			this.setState({
				formPreview:{
					schema:formStructure[key],
					uischema:newUiSchema
				}
			});
		}
	}

	submitFile() {
		const { reInitializeDataLocal , localPathAppend } = this.props;
		let data = new FormData();
		let f2 = this.refs.dataUpload.files[0];
		data.append("data",f2);
		let formId = this.refs.formI.value;
		this.setState({
			submitting:true
		}, () => {
			axios({ method:'post', url:(localPathAppend+"/postData/"+formId), data: data, headers:{ 'Content-Type': 'multipart/form-data'}})
				.then((res) => {
			  	reInitializeDataLocal(res.data.payload);
				})
				.catch((err) => {
			  	console.log(err);
				})
		});
	}

	render(){
		const { formId, formPreview, submitting, formStructure } = this.state;
		let previewJsx, showPreview = !!formPreview;
		let formJsx;
		
		if(formId.length) {
			formJsx = formId.map((v,i) => 
				<option value={v} key={i}>{formStructure[v].title}</option>)
		}

		if(showPreview){
			if(formPreview.schema.type === 'csv'){
				previewJsx = <div>{formPreview.schema.title}<br/>This form is of type csv - csv form template is directly sent to people and they fill it with data</div>
			} else {
				previewJsx = <Form schema={formPreview.schema} uiSchema={formPreview.uischema}>
					<button type="submit" class="hide">Submit</button>
				</Form>;
			}
			
		}

		return (<div>
			{submitting && 
					<span><div class="loading"></div> Uploading Data...</span>
			}
			{!submitting &&
				<div>
					<div><h4>Please choose a form for data upload:</h4></div>
					<select onChange={this.loadForm} ref="formI" class="form-control select-width">
							<option value="">Please choose a form to load</option>
							{formJsx}
					</select>
					{showPreview && 
						<div>
							<h4 class="preview-title">Form Preview:</h4>
							<div class="preview">
								<span>Please make sure that your csv has the empId column</span>
								{previewJsx}
							</div>
						</div>
					}
					<form encType="multipart/form-data">
					  <div class="margin-top-15 margin-bottom-30">
					     <span>Upload Data with CSV Template</span><br/>

					       <input ref="dataUpload" type="file" name="org2" accept=".csv" class=""/>
					    <input type="button" value="Upload" onClick={this.submitFile} class="uploadFlie" />
					  </div>
					</form>
				</div>
			}
		</div>);
	}

	componentDidMount() {
		const { formStructure } = this.props;
		let map ={}, uiMap = {};
		let map2 = [];
		formStructure.filter(v => !v.archived).forEach((v,i) => {
			map[v.formId] = v.structure;
			uiMap[v.formId] = v.uiSchema;
			map2.push(v.formId);
		});

		this.setState({
			formStructure:map,
			formPreview:null,
			submitting:false,
			formId:map2,
			uiMap:uiMap
		}, () => {
			if(this.refs.formI.value)
				this.loadForm(null, this.refs.formI.value)
		});	
	}

	componentWillReceiveProps(newProp){
		const { formStructure } = newProp;
		let map ={}, uiMap = {};
		let map2 = [];
		formStructure.filter(v => !v.archived).forEach((v,i) => {
			map[v.formId] = v.structure;
			uiMap[v.formId] = v.uiSchema;
			map2.push(v.formId);
		});

		this.setState({
			formStructure:map,
			formPreview:null,
			submitting:false,
			formId:map2,
			uiMap:uiMap
		}, () => {
			if(this.refs.formI.value)
				this.loadForm(null, this.refs.formI.value)
		});		
	}
}

export default DataUpload;