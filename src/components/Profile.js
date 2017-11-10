import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class Profile extends Component {
	render(){		
		const { name, empId, email, directManager, role } = this.props;

		let isAdmin = role && (role === 'admin');
		let isUser = role && (role === 'user');
		let isReporter = role && (role === 'reporter');

		let isRootActive = false, active = location.pathname;
		let nonRootActive=false;

		if (isAdmin) {
			 isRootActive = (active === '/' || active === '/hierarchySelect');
		} else {
			isRootActive = (active === '/' || active === '/userForm');
		}

		if(!isRootActive){
			nonRootActive = active.substring(1);
		}

		return (<section class="personal-details">
			<div class="user-info"><div class="user-icon glyphicon-user"></div>
			<table><tbody><tr><td>Name:</td><td>{name}</td></tr>
			<tr><td>Emp Id:</td><td>{empId}</td></tr>
			<tr><td>Email:</td><td>{email}</td></tr>
			<tr><td>Manager:</td><td>{directManager}</td></tr></tbody></table></div>
			{isAdmin && <span class={nonRootActive?('active-'+nonRootActive):'main-option-wrapper'}>
					<Link to="hierarchySelect" class={isRootActive?'active2':''}><span>Push Forms</span></Link>
					<Link to="userdetail" class="userdetail-active"><span>Upload Details</span></Link>
					<Link to="uploadData" class="uploadData-active"><span>Upload Data</span></Link>
					<Link to="buildForm" class="buildForm-active"><span>Create Forms</span></Link>
					<Link to="nodeReport" class="nodeReport-active"><span>Generate Report</span></Link>
					<Link to="addRole" class="addRole-active"><span>Set User Role</span></Link>
					<Link to="reports" class="reports-active">Old Reports</Link>
					<Link to="viewForm" class="viewForm-active">View Forms</Link>
					<Link to="userForm" class="userForm-active">Action Required</Link>
				</span>
			}

			{isUser && <span class={nonRootActive?('active-'+nonRootActive):''}>
				<Link to="reports" class="reports-active">Old Reports</Link>
				<Link to="userForm" class={isRootActive?'active2':''}><span>Action Required</span></Link>
			</span>}


			{isReporter && <span class={nonRootActive?('active-'+nonRootActive):''}>
				<Link to="reports" class="reports-active">Old Reports</Link>
				<Link to="userForm" class={isRootActive?'active2':''}><span>Action Required</span></Link>
				<Link to="nodeReport" class="nodeReport-active"><span>Generate Report</span></Link>
			</span>}
		</section>);
	}
}


export default Profile;