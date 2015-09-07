import React from 'react';

let ChangeSuccess = React.createClass({
	getInitialState(){
		return {id: this.props.query.successMessage};
	},

	render(){
		return <div>{this.state.id}</div>
	}
});

export default ChangeSuccess;