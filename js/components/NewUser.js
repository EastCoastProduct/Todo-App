import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

let NewUser = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
		if (!auth.loggedIn()) {
      		this.transitionTo('login');
      	} else {
      		var userStatus = auth.getStatus();
        	var userId = auth.getUserId();
        	if (userStatus == "created") {
	            this.transitionTo('changepassword', null, {id: userId});
	        }
      	}

	  	return { uid: '', first_name: '', last_name: '', email: '', isAdmin: false, user: {}, message: '' };
	},

	componentWillMount() {
		this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/users/');
	},

	componentWillUnmount() {
		this.firebaseDb.off();
	},

	inputEmailTextChange(e) {
    	this.setState({email: e.target.value, emailMessage: '', message: ''});
	},

	inputFirstNameTextChange(e) {
    	this.setState({first_name: e.target.value, firstNameMessage: '', message: ''});
	},

	inputLastNameTextChange(e) {
    	this.setState({last_name: e.target.value, lastNameMessage: '', message: ''});
	},

	inputIsAdminChange(e) {
    	this.setState({isAdmin: e.target.checked});
	},

	generatePassword() {
		var chars = "0123456789abcdefghijklmnopqrstuvwxyz-ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  		var pass = "";

		for (var i = 0; i < 32; i++) {
		    pass += chars[Math.floor(Math.random() * chars.length)];
		}
		return pass;
	},

	createUser(e) {
		e.preventDefault();
		this.handleValidation(res => {
			if(res){
				this.firebaseDb.createUser({ 
			  		email: this.state.email,
					password: this.generatePassword()
				}, function(error, userData) {
					if (error) {
						switch (error.code) {
							case "EMAIL_TAKEN":
								this.setState({message: "The new user account cannot be created because the email is already in use."});
							break;
							case "INVALID_EMAIL":
								this.setState({message: "The specified email is not a valid email."});
							break;
							default:
							this.setState({message: "Error creating user."});
						}
					} else {
						this.setState({uid: userData.uid})
						this.firebaseDb.resetPassword({
							email: this.state.email
						}, function(error) {
							if (error === null) {
								this.firebaseDb.push({
									uid: this.state.uid,
								    first_name: this.state.first_name,
								    last_name: this.state.last_name,
								    email: this.state.email,
								    isAdmin: this.state.isAdmin,
								    status: "created"
								});
								this.setState({ first_name: '', last_name: '', email: '', isAdmin: false }); 
								this.transitionTo('users');
							} else {
								switch (error.code) {
									case "INVALID_USER":
										this.setState({message: "The specified user account does not exist."});
									break;
									default:
									this.setState({message: "Error, please contact administrator."});
								}
							}
						}.bind(this));
					}
				}.bind(this));
			}
		})
	},

	cancel() {
		this.transitionTo('users');
	},

	handleValidation(response){
		response = arguments[arguments.length - 1];
		var err = false;
		var emailRegex = /^[a-z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)?@[a-z][a-zA-Z-0-9]*\.[a-z]+(\.[a-z]+)?$/;

		if(this.state.first_name.trim().length == 0){
			this.setState({ firstNameMessage: 'Enter first name.' });
			err = true;
		}

		if(this.state.last_name.trim().length == 0){
			this.setState({ lastNameMessage: 'Enter last name.' });
			err = true;
		}

		if(!emailRegex.test(this.state.email)){
			this.setState({ emailMessage: 'Enter a valid email address.' }); 
			err = true;
		}
		if(err){ response (false); return; } else { response (true); return; }
	},

	render() {
		return <div>
					<form className = "newuser-form newuser-content container" onSubmit={this.createUser} >
						<div><span>First name:</span>
				           <input type = 'text' value = { this.state.first_name } onChange = {this.inputFirstNameTextChange} />
				           <div>{this.state.firstNameMessage}</div>
				       </div>
				       <div><span>Last name:</span>
				           <input type = 'text' value = { this.state.last_name } onChange = {this.inputLastNameTextChange} />
				           <div>{this.state.lastNameMessage}</div>
				       </div>
						<div><span>E-mail:</span>
				            <input type = 'text' value = { this.state.email } onChange = {this.inputEmailTextChange} />
				            <div>{this.state.emailMessage}</div>
				        </div>
				        <div><span>Admin:</span>
				            <input type = 'checkbox' checked = { this.state.isAdmin } onChange = {this.inputIsAdminChange} />
				        </div>
	                    <div>
		                    <button className="form-button newuser-button-add"> Add new user </button>
		                    <button className="form-button newuser-button-cancel" onClick={this.cancel}> Cancel </button>
	                    </div>
					</form>
					{this.state.message}
				</div>;
	}
});

module.exports = NewUser;