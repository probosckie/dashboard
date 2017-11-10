import React, { Component } from 'react';
import { Link } from 'react-router-dom';


class Navigation extends Component {
	constructor(){
		super();
	}


	render(){
		const { role, whichForm }= this.props;
		const test = false;


		let isAdmin = (role === "admin")

		return <nav class="navHeader">
			{isAdmin && <Link to="userdetail" className="separate">User Detail Upload</Link>}
			{test && <Link to="sendmail" className="separate">Send Mail</Link>}
			{test && <Link to="orgTree" className="separate">Organization Tree</Link>}
			{isAdmin && <Link to="hierarchySelect" className="separate">Push Forms</Link>}

			{test && <Link to="dropDownTest" className="separate">Drop Down test</Link>}
			{test && <Link to="dynamicform" className="separate">Dynamic Forms</Link>}
			{isAdmin && <Link to="uploadData" className="separate">Upload Data</Link>}
			{isAdmin && <Link to="buildForm" className="separate">Create Form</Link>}
			{isAdmin && <Link to="nodeReport" className="separate">Generate Report</Link>}


		</nav>;
	}
}


export default Navigation;

