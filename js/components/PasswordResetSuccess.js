import React from 'react';

let Home = React.createClass({
	getInitialState(){
		return {id: this.props.query.successMessage};
	},

	render(){
		return <div>{this.state.id}</div>
	}
});

export default Home;