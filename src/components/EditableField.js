import React, { Component } from 'react';
import ReactDOM from 'react-dom';

class EditableField extends Component {
	constructor(){
		super();
		this.state = {
			edit:false,
			editedValue:null,
			fieldName:null
		}
		this.editValue = this.editValue.bind(this);
		this.changeValue = this.changeValue.bind(this);
	}

	editValue(e){
		let value = this.refs.copyFrom.innerHTML;
		this.refs.edit.value = value;
		this.setState({
			edit:true
		});
	}

	changeValue(){
		let val = this.refs.edit.value;

		const { updateParentGrid, pk } = this.props;
		const { fieldName } = this.state;
		this.setState({
			editedValue:val,
			edit:false
		});
		updateParentGrid(pk,fieldName,val);
	}


	render(){
		const { edit, editedValue } = this.state;
		const editClass = edit?"":"hide";
		const inputClass = edit?"hide":"";

		return(<span className="entire" onClick={this.editValue}>
			<input ref="edit" className={"edit-input "+editClass} onBlur={this.changeValue} />
			<span className="data" ref="copyFrom" className={inputClass}>{editedValue}</span>
		</span>);
	}

	componentDidUpdate(prevProps){
		this.refs.edit.focus();
	}

	componentWillReceiveProps(newProp){
		const { fieldName, value } = newProp;
		this.setState({
			fieldName:fieldName,
			editedValue:value
		});
	}

	componentDidMount(){
		const { fieldName, value } = this.props;
		this.setState({
			fieldName:fieldName,
			editedValue:value
		});	
	}

}

export default EditableField;