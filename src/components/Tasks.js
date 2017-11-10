import React, { Component } from 'react';
import { Link } from 'react-router-dom';



class Tasks extends Component {

	render(){
		const { role } = this.props;
		let isAdmin = role && (role === 'admin') 
		return (<div>
			{isAdmin && 
				<div class="top-left-50 tasks-start">
					<Link to="userdetail" class="task-anchor"><div class="circle"><span class="move-text">Upload Details</span></div></Link>
					<Link to="hierarchySelect" class="task-anchor"><div class="circle"><span class="move-text">Push Forms</span></div></Link>
					<Link to="uploadData" class="task-anchor"><div class="circle"><span class="move-text">Upload Data</span></div></Link>
					<Link to="buildForm" class="task-anchor"><div class="circle"><span class="move-text">Create Forms</span></div></Link>
					<Link to="nodeReport" class="task-anchor"><div class="circle"><span class="move-text">Generate Report</span></div></Link>
					<Link to="orgTree" class="task-anchor"><div class="circle"><span class="move-text">See Org Tree</span></div></Link>
					<Link to="addRole" class="task-anchor"><div class="circle"><span class="move-text">Set User Role</span></div></Link>

				</div>}
		</div>);
	}
}


export default Tasks;