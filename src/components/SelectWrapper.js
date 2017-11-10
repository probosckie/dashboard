import React, { Component } from 'react';
import Select from 'react-select';
import ReactDOM  from 'react-dom';


class SelectWrapper extends Component {

	render(){
		const { disabled, value, placeholder, options, onC, which, shudContainCheckbox, onCheck } = this.props;
		

		return (
			<div class="margin-bottom-15 select-dd">
			<label class='fancy-checkbox-label'>
			        {placeholder}:
			</label>
			<Select multi simpleValue disabled={disabled} value={value} placeholder={placeholder} options={options} onChange={(e) => onC.call(this, e, which)} />
			{ shudContainCheckbox && 
				<span>
				<div class="fl-checkbox-left">
					<input id={"checkbox-"+which} type="checkbox" ref={"check"+which} class="form-control margin-top-10 notificationCheck sr-only small-checkbox" disabled={disabled} onChange={() =>  {
							let myState = this.refs["check"+which].checked;
							let other = this.refs["check-all"+which];
							let anyOneChecked = this.refs["check"+which].checked || this.refs["check-all"+which].checked;
							//if other is checked, deselect it - otherwise do nothing
							if(other.checked && myState) {
								other.checked = false;
							}
							onCheck(anyOneChecked,which);
						}
					} /> 
					<label for={"checkbox-"+which} class="checkbox-label fancy-checkbox-label approval-checkbox">
					        {(which===0)?"Top Managers in this BU":"Select All immediately below"}
					</label>					

				</div>
				<div class="fl-checkbox-right">
					<input id={"checkbox2-"+which} type="checkbox" ref={"check-all"+which} class="form-control margin-top-10 notificationCheck sr-only small-checkbox" disabled={disabled} onChange={() => {
							let myState = this.refs["check-all"+which].checked;
							let other = this.refs["check"+which];
							let anyOneChecked = this.refs["check"+which].checked || this.refs["check-all"+which].checked;
							//if other is checked, deselect it - otherwise do nothing
							if(other.checked && myState) {
								other.checked = false;
							}
							onCheck(anyOneChecked,which,true);
						}
					} />

				<label for={"checkbox2-"+which} class="checkbox-label fancy-checkbox-label approval-checkbox">
					        Select Everybody below {(which===0)?"this BU":""}
				</label>
				</div>		
				<div class="clear-both"></div>

				</span>
			
			} 
			<br/>
			</div>);
	}

}

export default SelectWrapper;
