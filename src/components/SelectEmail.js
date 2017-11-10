import React, { Component } from 'react';
import Select from 'react-select';



class SelectEmail extends Component {
	constructor() {
		super();
		this.state = {
			data: [],
			selectedValue:""
		};
		this.onChange = this.onChange.bind(this);
		this.setUser = this.setUser.bind(this);
	}

	onChange(v){
		this.setState({
			selectedValue:v
		});
	}

	setUser(){
		const { setEmailAndInitialize } = this.props;
		const { selectedValue } = this.state;
		setEmailAndInitialize(selectedValue.value);
	}

	render(){
		const { data, selectedValue } = this.state;
		return (<div class="container formHolder">
			Please choose the Email for user replication
			{data.length>0 && <div>
				<Select 
					name="Select Email"
				  options={data}
				  value={selectedValue}
				  onChange={this.onChange}
				/> <br/>
				<button class="btn btn-default" onClick={this.setUser}>{"Behave like " + (selectedValue.label || '')}</button>
			</div>
			
			}
		</div>);
	}

	componentDidMount() {
		const { userData } = this.props;
		let map2;
		map2 = userData.map((v) => {
			return {
				label:v.fullName,
				value:v.email
			}
		});
		this.setState({
			data:map2
		});
	}

	componentWillReceiveProps(props) {
		const { userData } = props;
		let map2;
		map2 = userData.map((v) => {
			return {
				label:v.fullName,
				value:v.email
			}
		});
		this.setState({
			data:map2
		});
	}
}

export default SelectEmail;





