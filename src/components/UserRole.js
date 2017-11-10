import React, { Component } from 'react';
import Select from 'react-select';
import axios from 'axios';


class UserRole extends Component {
	constructor(){
		super();
		this.state = {
      reporters:{
      },
      admin: {
      },
      submitting:false,
      allUsers:[]
		};
		
		this.initialize = this.initialize.bind(this);
		this.sendData = this.sendData.bind(this);
		this.changeReporter = this.changeReporter.bind(this);
		this.changeAdmin = this.changeAdmin.bind(this);
	}



	changeReporter(value){
		const { reporters } = this.state;
		reporters.value = value;
		this.setState({reporters})
	}


	changeAdmin(value){
		const { admin } = this.state;
		admin.value = value;
		this.setState({admin})
	}

	initialize() {

		const { employeeMap, roleMap, allUsers } = this.state;
		let i,buff = [];
		
		let adminOption=[],reporterOption=[];
		let adminValue, reporterValue;

		roleMap.user.forEach(v => {
			adminOption.push({value:v.toString(), label:employeeMap[v].fullName});
			reporterOption.push({value:v.toString(), label:employeeMap[v].fullName});
			allUsers.push(v);
		});

		roleMap.admin.forEach(v => {
			adminOption.push({value:v.toString(), label:employeeMap[v].fullName});
			reporterOption.push({value:v.toString(), label:employeeMap[v].fullName});
			allUsers.push(v);
		});

		adminValue = roleMap.admin.map(v => v.toString());

		roleMap.reporter.forEach(v => {
			reporterOption.push({value:v.toString(), label:employeeMap[v].fullName});
			adminOption.push({value:v.toString(), label:employeeMap[v].fullName});
			allUsers.push(v);
		});

		reporterValue = roleMap.reporter.map(v => v.toString());

		this.setState({
			allUsers,
			reporters:{
				options:reporterOption,
				value:reporterValue
			},
			admin: {
				options:adminOption,
				value:adminValue
			}
		});
	}

	sendData() {
		const { reporters, admin, roleMap, allUsers, empId } = this.state;
		const { setRoleMapLocal } = this.props;
		let newReporters = [],newAdmin = [], payload;
		let newUsers = [], reportersAndAdmins =[];
		



		if(Array.isArray(admin.value) && admin.value.length > 0 ) {
			newAdmin = admin.value.map(v => parseInt(v));
		} else if (admin.value.length > 0) {
			newAdmin = admin.value.split(',').map(v => parseInt(v));
		}

		if (Array.isArray(reporters.value) && reporters.value.length > 0){
			newReporters = reporters.value.map(v => parseInt(v));
		} else if (reporters.value.length > 0) {
			newReporters = reporters.value.split(',').map(v => parseInt(v));
		}

		if(newReporters.length > 0)
			newReporters = newReporters.filter(v => (newAdmin.indexOf(v) === -1))
		
		reportersAndAdmins = newAdmin.concat(newReporters);

	  newUsers = allUsers.filter(v => (reportersAndAdmins.indexOf(v) === -1));

		const { localPathAppend } = this.props;	

		payload = {
			"user":newUsers,
			"admin":newAdmin,
			"reporter":newReporters
		};

		this.setState({
      submitting:true
		}, () => {
			axios.post(localPathAppend+'/setRole', payload)
			.then((res) => {
				let roleMap = res.data.payload;
				console.log(roleMap);
				let newRole = ((roleMap.admin.indexOf(empId) !== -1)?'admin':((roleMap.reporter.indexOf(empId) !== -1)?'reporter':'user'));
				setRoleMapLocal(roleMap,newRole);
			}, (err) => {
				console.log(err);
			});
		});
	}

	render() {
		const { additionalPeople, submitting, users, reporters, admin } = this.state;
		return (
			<div class="container formHolder">
				{submitting && 
						<span><div class="loading"></div> Pushing Roles...</span>
				}


				{!submitting && <div>
					<span>Select Reporters</span>
					<Select multi simpleValue disabled={false} value={reporters.value} options={reporters.options} placeholder="Select Reporters" onChange={this.changeReporter} />
					<br/>
					<span>Select Admin</span>
					<Select multi simpleValue disabled={false} value={admin.value} options={admin.options} placeholder="Select Admins" onChange={this.changeAdmin} />
					<br/>
					<div class="margin-bottom-15">
							<button onClick={this.sendData} class="btn btn-default">Change roles</button>
					</div>
				</div>}
			</div>
		);
	}

	componentDidMount() {
		const { employeeMap, roleMap, empId } = this.props;
		this.setState({
			employeeMap: employeeMap,
			roleMap,
			empId: parseInt(empId),
			submitting:false
		}, () => this.initialize())
	}

	componentWillReceiveProps(newProp){
		const { employeeMap, roleMap, empId } = newProp;
		this.setState({
			employeeMap: employeeMap,
			roleMap,
			empId: parseInt(empId),
			submitting:false
		}, () => this.initialize())
	}
}

export default UserRole;