import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

//add cancel button

let NewUser = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
      	if (!auth.loggedIn()) {//if not admin, show message that he doesn't have rights
      		console.log("redirect to login");
      		this.transitionTo('login');
      	};

		this.user = {};
	  	return { uid: '', first_name: '', last_name: '', email: '', isAdmin: false, user: {}};
	},

	componentWillMount() {
		this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/users/');
	},

	inputEmailTextChange(e) {
    	this.setState({email: e.target.value});
	},

	inputPasswordTextChange(e) {
    	this.setState({password: e.target.value});
	},

	inputFirstNameTextChange(e) {
    	this.setState({first_name: e.target.value});
	},

	inputLastNameTextChange(e) {
    	this.setState({last_name: e.target.value});
	},

	inputIsAdminChange(e) {
    	this.setState({isAdmin: e.target.checked});
	},

	createUser(e) {
		e.preventDefault();
		if (this.state.email.trim().length !== 0) {
				this.firebaseDb.createUser({ 
		  		email: this.state.email,
				password: this.state.password
			}, function(error, userData) {
				if (error) {
					console.log("Error creating user:", error);
				} else {
					console.log("Successfully created user account with uid:", userData.uid);
					this.setState({uid: userData.uid})
					this.firebaseDb.push({
						uid: this.state.uid,
					    first_name: this.state.first_name,
					    last_name: this.state.last_name,
					    email: this.state.email,
					    isAdmin: this.state.isAdmin
					});
					this.setState({first_name: ""}); 
					this.setState({last_name: ""});
					this.setState({email: ""}); 
					this.setState({password: ""});
					this.setState({isAdmin: false});
					this.transitionTo('users');
				}
			}.bind(this));
		};
	},

	render() {
		return <div>
					<form onSubmit={this.createUser} >
						<div><span>First name:</span>
				           <input type = 'text' value = { this.state.first_name } onChange = {this.inputFirstNameTextChange} />
				       </div>
				       <div><span>Last name:</span>
				           <input type = 'text' value = { this.state.last_name } onChange = {this.inputLastNameTextChange} />
				       </div>
						<div><span>E-mail:</span>
				            <input type = 'text' value = { this.state.email } onChange = {this.inputEmailTextChange} />
				        </div>
				        <div><span>Password:</span>
				            <input type = 'text' value = { this.state.password } onChange = {this.inputPasswordTextChange} />
				        </div>
				        <div><span>Admin:</span>
				            <input type = 'checkbox' checked = { this.state.isAdmin } onChange = {this.inputIsAdminChange} />
				        </div>
	                    <div>
		                    <span><button> Add new user </button></span>
	                    </div>
					</form>
				</div>;
	}
});

module.exports = NewUser;