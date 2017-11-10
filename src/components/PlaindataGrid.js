import React, { Component } from 'react';

class PlaindataGrid extends Component {
	render(){
		const { headers, data } = this.props;
		let tbodyJsx = data.map((v,i) => {
			return (<tr key={i}> 
							{v.map((v1,i1) => <td key={i1}>{v1}</td>)} 
						</tr>);
		});  
		return (
			<table>
				<thead>
					<tr>
						{headers.map((v,i) => <th key={i}>{v}</th>)}
					</tr>
				</thead>
				<tbody>
					{tbodyJsx}
				</tbody>
			</table>
		);

	}
}


export default PlaindataGrid;

