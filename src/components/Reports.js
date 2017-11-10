import React, { Component } from 'react';
import Form from 'react-jsonschema-form';
import PlaindataGrid from './PlaindataGrid';


class Reports extends Component {
	constructor(){
		super();
		this.state = {
			formStructure:null,
			empId:null,
			initialFormData:null,
			empMap:null,
			formSchemas:[],
			uischema: {
				"ui:disabled": true
			},
			recurFormData:null,

		};
		this.showForm = this.showForm.bind(this);
		this.visibleForm = this.visibleForm.bind(this);
		this.showRecurFormData = this.showRecurFormData.bind(this);
	}


	showForm() {
		const { formStructure, empId, initialFormData, empMap, uiMap } = this.state;
		let i,jsxArr = [];
		let temp,temp2, temp3;
		let formList = initialFormData[empId];
		for (i in formList) {
			temp = {};
			temp.uischema = uiMap[i];
			if(temp.uischema)
				temp.uischema["ui:disabled"] = true;
			temp2 = formStructure[i];
			if(temp2.type !== 'csv'){
				/*temp2.properties.comments = {
						type:"string",
						default:"",
						title:"Concerns or comments"
				};*/
				temp.csv = false;
			} else {
				temp.csv = true;
			}
			
			temp.index = i;
			temp.schema = temp2;
			temp.formData = formList[i];
			temp.approver = empMap[formList[i].approver] ? empMap[formList[i].approver].fullName : '';
			temp.status = formList[i].approval;
			if ((temp.status === "sent-for-approval" || temp.status === "approved" || temp.status === "not-needed")) {
				jsxArr.push(temp);
			}
		}
		this.setState({
			formSchemas:jsxArr
		});
	}

	visibleForm(n){
		let all = document.querySelectorAll('.all-sec');
		let all2 = document.querySelectorAll('.pbl');
		[].map.call(all,(e) => e.classList.add('hide'));
		[].map.call(all2,(e) => e.classList.add('hide'));
		let target = document.querySelector('.sec-'+n);
		target.classList.remove('hide');
	}

	showRecurFormData(publishId,dateString){
		let classString = ".pbl-"+publishId+"-"+(new Date(dateString)).getTime();
		let all = document.querySelectorAll('.pbl');
		let all2 = document.querySelectorAll('.all-sec');
		[].map.call(all,(e) => e.classList.add('hide'));
		[].map.call(all2,(e) => e.classList.add('hide'));
		let target = document.querySelector(classString);
		target.classList.remove('hide');
	}

	render(){
		const { formSchemas, initialFormData, empId, recurFormData, publishFormMap, formStructure, uischema, uiMap, nameMap } = this.state;
		let formSelectJsx = null;
		if(initialFormData && empId && initialFormData[empId]){
			let listOfForms = Object.keys(initialFormData[empId]);
			formSelectJsx = listOfForms.map((v,i) => {
				if(initialFormData[empId][v].approval !== 'not-approved')
					return <li key={i} onClick={() => this.visibleForm(v)}>{nameMap[v]}</li>;
			})
		}

		let recurKeys = recurFormData && Object.keys(recurFormData).filter(v => v !== 'type' && v !== 'headers');

		let formJsx, showStuff = formSchemas.length > 0;

		if (showStuff) {
			formJsx = formSchemas.map((v,i) => {
				return (<div key={i} class={"hide all-sec sec-"+v.index}>
					<div class='margin-top-20 form-status-begin'></div>
					<div>Approval Status: <strong class="status-color">{(v.status === "not-needed"?"Form doesnt follow an approval flow":v.status)}</strong></div>
						<div class="preview margin-right-25 margin-top-0">
							{!v.csv && <Form schema={v.schema} formData={v.formData} uiSchema={v.uischema}><button type="submit" class="hide">Submit</button></Form>}
							{v.csv && <PlaindataGrid data={v.formData.data} headers={v.formData.headers} />}
						</div>
				</div>);
			})
		}
		
		return ((<div>
			<div><h3>Previous forms you filled:</h3></div>
			<div class="contain-left-10 form-list-section">
				Normal Forms:
				<ul class="forms-list">
					{formSelectJsx}
				</ul>

				Recurring Forms:
				{
					recurKeys && recurKeys.map((v,i) => {
						var dateObj = Object.keys(recurFormData[v]).filter(v => v !== 'type' && v !== 'headers');
						return (<div key={i}><span>publishId {v}</span>
							<ul class="forms-list">
									{dateObj.map((v1,i1) => {
										return <li key={i1} onClick={() => this.showRecurFormData(v,v1)}>{v1}</li>;
									})}
							</ul>
						</div>);
					})
				}
			</div>
			<div class="contain-right-80">
				{showStuff && 
					<div>
					{formJsx}	
					</div>
				}

				{!!recurKeys && 
					<div>
						{
						  recurKeys && recurKeys.map((v,i) => {
						    var dateObj = Object.keys(recurFormData[v]).filter(v => v !== 'type' && v !== 'headers');
						    var headers = recurFormData[v].headers;
						    var formId = publishFormMap[v].formId;
						    var schema = formStructure[formId];
						    var isCsv = (formStructure[formId].type === 'csv');
						    var uiSchema;
						    if(!isCsv){
									uiSchema = uiMap[formId];
						    	uiSchema["ui:disabled"] = true;
						    }
						    

						    return (<div key={i}>
						      {dateObj.map((v1,i1) => {
						        var formData = recurFormData[v][v1];
						        var classString = "hide pbl pbl-"+v+"-"+((new Date(v1)).getTime());
						        return <div key={i1} class={""+classString}>
						        	<div>Form type:<strong class="status-color">Recurring</strong></div>
						        	<div class="preview margin-right-25 margin-top-0">
						          {!isCsv && <Form schema={schema} formData={formData} uiSchema={uiSchema}><button type="submit" class="hide">Submit</button></Form>}
						          {isCsv && <PlaindataGrid data={formData} headers={headers} />}
						          </div>
						        </div>;
						      })}
						    </div>)
						  })
						}
					</div>
				}
			</div>
			
		</div>));
	}

	componentDidMount() {
		const { formStructure, empId, initialFormData, empMap, recurFormData, publishFormMap } = this.props;
		let map ={}, uiMap = {}, nameMap = {};
		formStructure.forEach((v,i) => {
			map[v.formId] = v.structure;
			uiMap[v.formId] = v.uiSchema;
			if(v.formName){
				nameMap[v.formId] = v.formName;
			} else if (v.structure.title) {
				nameMap[v.formId] = v.structure.title;
			}
		});
		this.setState({
			formStructure:map,
			empId:empId, 
			initialFormData:initialFormData,
			empMap:empMap,
			recurFormData:recurFormData,
			publishFormMap:publishFormMap,
			uiMap,
			nameMap
		}, () => {
			this.showForm();
		});
	}

	componentWillReceiveProps(newProp){
    const { formStructure, empId, initialFormData, empMap, recurFormData, publishFormMap } = newProp;
    let map ={}, uiMap = {}, nameMap = {};
		formStructure.forEach((v,i) => {
			map[v.formId] = v.structure;
			uiMap[v.formId] = v.uiSchema;
			if(v.formName){
				nameMap[v.formId] = v.formName;
			} else if (v.structure.title) {
				nameMap[v.formId] = v.structure.title;
			}
		});
		this.setState({
			formStructure:map,
			empId:empId, 
			initialFormData:initialFormData,
			empMap:empMap,
			recurFormData:recurFormData,
			publishFormMap:publishFormMap,
			uiMap,
			nameMap
		}, () => {
			this.showForm();
		}); 
  }
}


export default Reports;





