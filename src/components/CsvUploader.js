import React, { Component } from 'react';
import axios from 'axios';
import FormdataGrid from './FormdataGrid';
import _ from 'lodash';

class CsvUploader extends Component {
	constructor() {
		super();
		this.state = {
			orgData:null
		};
		this.submitFile = this.submitFile.bind(this);
		this.updateRows = this.updateRows.bind(this);
		this.updateData = this.updateData.bind(this);
	}
	
	submitFile() {
		var data = new FormData();
		var f2 = this.refs.fileData.files[0];
		const { localPathAppend } = this.props;
		data.append("data",f2);


		axios({
		  method:'post',
		  url:(localPathAppend+ "/postOrg"),
		  data: data,
		  headers: {
		    'Content-Type': 'multipart/form-data'
		  }
		}).then((res) => {
		  this.refreshData();
		}).catch((err) => {
		  console.log(err);
		})
	}


	updateData(modified) {
		const { localPathAppend } = this.props;
		axios.post(localPathAppend+'/updateUserData', modified)
			.then((res) => {
				console.log('data has been modified')
			},(err) => {
				console.log(err);
			});
	}

	updateRows(modified) {
		let updateObject = [];
		let { orgData } = this.state;
		let now;
		modified.forEach((v,i) => {
			let pk = v.empId;
			let corresponding = orgData.filter((v,i) => v.empId === pk)[0];
			let naya = {...v};
			now = new Date();
			now = now.toString();
			let history = corresponding.archiveRoles;
			let archiveEntry = {
				from:corresponding.updatedOn,
				till:now
			};
			history.push(archiveEntry);
			naya.archiveRoles = history;
			naya.updatedOn = now;
			updateObject.push(naya);
		});

		this.updateData(updateObject);
	}

	render(){
		const { orgData } = this.state;
		const { localPathAppend } = this.props;

		const headers = [
			{"Employee Id": "empId"},
			{"Email":"email"}, 
			{"Full Name":"fullName"}, 	
			{"Manager Emp Id":"managerEmpId"},
			{"Manager Name":"managerName"},
			{"Manager Email":"managerEmail"},
			{"BU":"bu"}
		];

		return <div className="wrapper">
		
		<h3>Employees Details</h3>

		<div class="uploadSection">
			<form encType="multipart/form-data">
			  <div class="margin-top-15 margin-bottom-30">
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

	  {orgData && <FormdataGrid headers={headers} data={orgData} pk="empId" update={this.updateRows} />}


	  </div>;
	}

	componentDidMount(){
		const { orgData } = this.props;
		this.setState({orgData:orgData});
	}

	componentWillReceiveProps(newProp){
    const { orgData } = newProp;
		this.setState({orgData:orgData});
  }
}

export default CsvUploader;