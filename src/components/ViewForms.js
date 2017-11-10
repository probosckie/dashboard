import React, { Component } from 'react';
import Form from 'react-jsonschema-form';
import Select from 'react-select';
import axios from 'axios';


class ViewForms extends Component {
	constructor(){
		super();
		this.state = {
			formId:[],
			formStructure:null,
			formPreview:null,
			allForms: {
				options: [],
				value:null
			},
			submitting:false
		}
		this.loadForm = this.loadForm.bind(this);
		this.addFormToRemove = this.addFormToRemove.bind(this);
		this.deleteForms = this.deleteForms.bind(this);
	}

	loadForm(e,index){
		let key = index || e.target.value;
		const { formStructure, uiMap } = this.state;
		let newUiSchema = uiMap[key] || {};
		newUiSchema["ui:disabled"]  = true;
		if(e.target.value) {
			this.setState({
				formPreview:{
					schema:formStructure[key],
					uischema:newUiSchema
				}
			});
		}
	}

	addFormToRemove(value){
		const { allForms } = this.state;
		allForms.value = value;
		this.setState({allForms});
	}

	deleteForms(){
		const { requestFormStructureLocal, localPathAppend } = this.props;
		const { allForms } = this.state;
		let payload = {};
		let delArr = allForms.value.split(',');
		delArr = delArr.map(v => allForms.options[v].id);
		payload.deleteArr = delArr;
		this.setState({
			submitting:true
		}, () => {
			axios.post(localPathAppend+'/deleteForms', payload)
				.then((res) => {
					requestFormStructureLocal(false,res.data.payload);
				})
				.catch(err => console.log(err))
		});
	}

	render(){
		const { formId, formPreview, formStructure, allForms, submitting } = this.state;
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
				{
					submitting && <span><div class="loading"></div> Publishing Form...</span>
				}
				
				{
					!submitting && <span>
						<div><h4>Show form views</h4></div>
						<select onChange={this.loadForm} ref="formI" class="form-control select-width">
								<option value="">Please choose a form to load</option>
								{formJsx}
						</select>
						{showPreview && 
							<div>
								<h4 class="preview-title">Form Preview:</h4>
								<div class="preview">
									{previewJsx}
								</div>
							</div>
						}

						<div class="margin-top-20">
							<h4>Delete forms</h4>
							<Select multi simpleValue disabled={false} value={allForms.value} options={allForms.options} placeholder="Choose Forms" onChange={this.addFormToRemove} />
							<div class="margin-bottom-15">
								<button onClick={this.deleteForms} class="btn btn-default">Expire forms</button>
							</div>
						</div>
					</span>
				}
			</div>);
	}

	componentDidMount() {
		const { formStructure } = this.props;
		let map ={};
		let map2 = [], uiMap = {};
		let options = [];

		formStructure.filter(v => !v.archived).forEach((v,i) => {
			map[v.formId] = v.structure;
			uiMap[v.formId] = v.uiSchema;
			map2.push(v.formId);
			options.push({value:i.toString(), label:v.formName, id:v.formId });
		});

		this.setState({
			formStructure:map,
			formPreview:null,
			formId:map2,
			uiMap:uiMap,
			submitting:false,
			allForms:{
				options:options
			}
		});	
	}


	componentWillReceiveProps(newProp) {
		const { formStructure } = newProp;
		let map ={}, uiMap = {};
		let map2 = [];
		let options = [];
		
		formStructure.filter(v => !v.archived).forEach((v,i) => {
			map[v.formId] = v.structure;
			uiMap[v.formId] = v.uiSchema;
			map2.push(v.formId);
			options.push({value:i.toString(), label:v.structure.formName, id:v.formId});
		});

		this.setState({
			formStructure:map,
			formPreview:null,
			formId:map2,
			uiMap:uiMap,
			submitting:false,
			allForms:{
				options:options
			}
		});		
	}
}

export default ViewForms;