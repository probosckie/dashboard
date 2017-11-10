import React, { Component } from 'react';

class SetListDetails extends Component {
	constructor(){
		super();
		this.state = {
			stringList:[],
			saved:false
		}
		this.addLabel = this.addLabel.bind(this);
		this.setLabelText = this.setLabelText.bind(this);
		this.removeLavel = this.removeLavel.bind(this);
		this.saveThis = this.saveThis.bind(this);
	}

	addLabel(){
		const { stringList } = this.state;
		this.setState({
			stringList:[...stringList,'']
		});
	}

	removeLavel(e,i){
		let { stringList } = this.state;
		let len = stringList.length;
		let transformed = stringList.slice(0,i).concat(stringList.slice(i+1,len));
		this.setState({
			stringList:transformed
		});
	}

	saveThis(){
		const { stringList } = this.state;
		const { passLabel, index } = this.props;
		this.setState({
			saved:true
		}, passLabel(stringList,index));
	}

	setLabelText(e,i) {
		const val = e.target.value;
		const { stringList } = this.state;
		stringList[i] = val;
		this.setState({stringList});
	}

	render(){
		const { type } = this.props;
		const { stringList, saved } = this.state;
		return (<div>
			{!saved && <span>
				{stringList.map((v,i) => {
					return (<div key={i}>
						<label>Enter label# {i}</label>
						<span class="glyphicon glyphicon-remove" onClick={(e) => this.removeLavel.call(this,e,i)}></span>
						<input value={stringList[i]} type="text" class="form-control input-width" onChange={(e) => this.setLabelText.call(this,e,i)}/>
					</div>);
				})}
				<button onClick={this.addLabel} class="btn btn-default">Add label</button>
				<button onClick={this.saveThis} class="btn btn-default">Save Labels</button>
			</span>}
			{saved && <span>Label data has been saved</span>}
		</div>);
	}
}

export default SetListDetails;

