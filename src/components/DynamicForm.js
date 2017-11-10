import React, { Component } from 'react';
import Form from 'react-jsonschema-form';



const schema = {
  title: "User Form",
  type: "object",
  required: ["title"],
  properties: {
    title: {type: "string", title: "Title", default: "A new task"},
    done: {type: "boolean", title: "Done?", default: false}
  }
};

const schema2 = {
  title: "Fill Weekly hours",
  type: "object",
  required: ["hours"],
  properties: {
    hours: {type: "number", title: "Hours", default: "8"}
  }
};



const schema3 = {
  title: "Fill personal Information",
  type: "object",
  required: ["name","age"],
  properties: {
    name: {type: "string", title: "Name", default: "enter name"},
    age: {type: "number", title: "Age", default: "enter age"}
  }
};




const log = (type) => console.log.bind(console, type);

class DynamicForm extends Component {
  constructor(){
    super()
  }
	render(){
    console.log(this.props);
		return (<div>
			<Form schema={schema3}  onSubmit={log("submit")} onError={log("errors!")} />

		</div>);
	}
}

export default DynamicForm;


