import React from 'react';
import Select from 'react-select';





class MultiSelectField extends React.Component {
	constructor(){
		super();
		this.state = {
			disabled: false,
			options: [
				{ label: 'BU', value: '1' },
				{ label: 'BU2', value: '2' },
				{ label: 'BU3', value: '3' },
				{ label: 'BU4', value: '4' },
				{ label: 'BU5', value: '5' },
				{ label: 'BU6', value: '6' },
			],
			value: [],
		};

		this.handleSelectChange = this.handleSelectChange.bind(this);
		this.toggleDisabled = this.toggleDisabled.bind(this);
	}

	handleSelectChange (value) {
		console.log('You\'ve selected:', value);
		this.setState({ value });
	}
	
	toggleDisabled (e) {
		this.setState({ disabled: e.target.checked });
	}
	

	render(){
		return (
			<div className="section">
				
				<Select multi disabled={this.state.disabled} value={this.state.value} placeholder="Select your favourite(s)" options={this.state.options} onChange={this.handleSelectChange} />
				<br />



				<div className="checkbox-list">
					<label className="checkbox">
						<input type="checkbox" className="checkbox-control" checked={this.state.disabled} onChange={this.toggleDisabled} />
						<span className="checkbox-label">Disable the control</span>
					</label>
					
				</div>
			</div>
		);
	}
}

export default MultiSelectField;
