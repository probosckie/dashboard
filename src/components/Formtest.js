import React, { Component } from 'react';
import Form from 'react-jsonschema-form';

import SetListDetails from './SetListDetails';

const onError = (errors) => console.log("\nerror is", JSON.stringify(errors));


class Formtest extends Component {
	render(){
		//an array of radio buttons with a single title and labels for each radio
		/*const schema2 = {  
      "type": "object",
      "required": [
        "radioR"
      ],
      "properties": {
        "radioR": {
          "type": "string",
          "title": "Title of radio button",
          "enum": [
            "Radio value 1",
            "Radio value 2",
            "Radio value 3"
          ]
        }
      }
		};

		const uiSchema2 = {
	    "radioR": {
	      "ui:widget": "radio"
	    }
		};

    const formData2 = {
      "radioR":"Radio value 2"
    }*/

    /*const schema2 = {
        type:"object",
        title:"",
        properties:{
          "radioR2":{
            "type": "object",
            "title":"",
            "required": [
              "radioR"
            ],
            "properties": {
              "radioR": {
                "type": "string",
                "title": "Title of radio button",
                "enum": [
                  "Radio value 1",
                  "Radio value 2",
                  "Radio value 3"
                ]
              }
            }
          }
        }
    };

    const uiSchema2 = {
        "radioR2":{
          "radioR": {
            "ui:widget": "radio"
          }        
        }
      };

      const formData2 = {
        "radioR2":{"radioR":"Radio value 2"}
      }*/

    const schema2 = {  
      "title":"justaa",
      "type":"object",
      "properties":{  
         "big one":{  
            "type":"string",
            "title":"big one"
         },
         "checkbox1":{  
            "type":"object",
            "title":"",
            "required":[  
               "checkbox12"
            ],
            "properties":{  
               "checkbox12":{  
                  "type":"string",
                  "title":"your size",
                  "enum":[  
                     "small",
                     "medium",
                     "large"
                  ]
               }
            }
         },
         "checkbox2":{  
            "type":"array",
            "title":"dontate to",
            "items":{  
               "type":"string",
               "enum":[  
                  "ufo",
                  "fci",
                  "daa"
               ]
            },
            "uniqueItems":true
         }
      },
      "required":[  
         "big one"
      ]
   }

   const uiSchema2 = {  
      "ui:order":[  
         "big one",
         "checkbox1",
         "checkbox2"
      ],
      "big one":{  
         "ui:widget":"textarea",
         "ui:disabled":false
      },
      "checkbox1":{  
         "checkbox12":{  
            "ui:widget":"radio"
         },
         "ui:disabled":true
      },
      "checkbox2":{  
         "ui:widget":"checkboxes",
         "ui:disabled":true
      }
   }

    //a form with multiple checkboxes
    const schema = {
      type: "object",
      "title": "main title",
      properties: {
        "checky": {
          type: "array",
          title: "A multiple choices list",
          items: {
            type: "string",
            enum: ["foo", "bar", "fuzz", "qux"],
          },
          uniqueItems: true  
        }
      }    
    };

    const uiSchema = {
      "checky":{
        "ui:widget": "checkboxes"
      }
    }

    const formData = {
      "checky":["foo"]
    }



		return (<Form schema={schema2} uiSchema={uiSchema2} />);
	}
}

export default Formtest;