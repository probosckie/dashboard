import React, { Component } from 'react';
import EditableField from './EditableField';

class FormdataGrid extends Component {
	constructor(){
		super();
		this.state={
			filteredData:[],
			filterSet:{},
			dataCopy:null,
			rowIndexesChanged:[],
			pk:null
		}
		this.filterData = this.filterData.bind(this);
		this.setFilterTrue = this.setFilterTrue.bind(this);
		this.updateDataCopy = this.updateDataCopy.bind(this);
		this.sendDiff = this.sendDiff.bind(this);
	}

	filterData() {
		let { filterSet, dataCopy } = this.state;
		let newFilteredData;

		newFilteredData = dataCopy.filter((v,i) => {
			let k,condition=true;
			for (k in filterSet){
				if(v[k].toString().toLowerCase().indexOf(filterSet[k].toString().toLowerCase()) === -1)
					condition=false

			}
			return condition;
		});
		this.setState({
			filteredData:newFilteredData
		});	
	}

	updateDataCopy(pkV,header,value) {
		const { dataCopy,rowIndexesChanged,pk } = this.state;
		let index = dataCopy.findIndex((v,i) => {
			return v[pk] === pkV
		});
		
		if(rowIndexesChanged.indexOf(index) === -1)
			rowIndexesChanged.push(index);

		dataCopy[index][header] = value;
		this.setState({
			dataCopy:dataCopy,
			rowIndexesChanged:rowIndexesChanged
		});
	}

	setFilterTrue(e){
		let target = e.target;
		let fieldHeader = target.getAttribute('data-search');
		let value = target.value;
		let { filterSet } = this.state;
		if(value.trim().length > 0){
			filterSet[fieldHeader] = value;
		}
		else if(value.length === 0) {
			delete filterSet[fieldHeader];
		}
		this.setState({
			filterSet:filterSet
		});
		this.filterData();
	}

	sendDiff(){
		let diffObject = [];
		let { update } = this.props;
		const { rowIndexesChanged, dataCopy } = this.state;
		rowIndexesChanged.forEach((v,i) => {
			diffObject.push(dataCopy[v]);
		});
		update(diffObject);
	}

	render(){
		let { headers, data, pk} = this.props;
		let { filteredData } = this.state;

		let header = [];
		const headerJSX = headers.map((v,i) => {
			header.push(v[Object.keys(v)[0]]);
			return <th key={i}>{Object.keys(v)}</th>
		});

		const bodyJSX = filteredData.map((v,i) => {
			return <tr key={i}>
				{header.map((v1,i1) => {
					return <td key={i1}>{v1 === pk?v[v1]:<EditableField value={v[v1]} pk={v[pk]} fieldName={v1} updateParentGrid={this.updateDataCopy} />}</td>
				})}
			</tr>
		});

		const filterJSX = headers.map((v,i) => {
			return <td key={i}><input data-search={header[i]} onKeyUp={this.setFilterTrue} placeholder={"Search "+header[i]} /></td>
		});

		return (<div>
			<table class="table">
				<thead>
					<tr>
						{filterJSX}
					</tr>
					<tr>
						{headerJSX}
					</tr>
				</thead>
				<tbody>
					{bodyJSX}
				</tbody>
			</table>
			<button onClick={this.sendDiff} class="uploadFlie saveButton">Save</button>
		</div>);
	}

	componentDidMount(){
		const { data, pk } = this.props;
		let newData = [];
		data.forEach((v,i) => {
			let temp = {...v};
			newData.push(temp);
		})
		this.setState({
			filteredData: newData,
			dataCopy:newData,
			pk:pk
		});
	}
	componentWillReceiveProps(newProp){
		const { data, pk } = newProp;
		let newData = [];
		data.forEach((v,i) => {
			let temp = {...v};
			newData.push(temp);
		})
		this.setState({
			filteredData: newData,
			dataCopy:newData,
			pk:pk
		});
	}
}

export default FormdataGrid;