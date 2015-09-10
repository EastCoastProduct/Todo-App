import React from 'react';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

let Home = React.createClass({
	mixins: [Router.Navigation],

	getInitialState(){
		var isLoggedIn = auth.loggedIn();
		if(isLoggedIn){
			this.transitionTo('moduleslist');
		} else {
			this.transitionTo('login');
		}
		return{};
	},

	render(){
		return <div></div>
	}
});

export default Home;