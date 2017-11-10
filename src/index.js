import React from 'react';
import ReactDOM from 'react-dom';
import Layout from './components/Layout';



import '!style-loader!css-loader!./../scss/bootstrap.min.css';
import '!style-loader!css-loader!sass-loader!./../scss/main.scss';
import 'react-select/dist/react-select.css';
import '!style-loader!css-loader!sass-loader!./../scss/basicLayout.scss';
import '!style-loader!css-loader!sass-loader!./../scss/newstyle.scss';



ReactDOM.render(
  <Layout/>,
  document.getElementById('app')
);


if(module.hot){
	module.hot.accept();
}


