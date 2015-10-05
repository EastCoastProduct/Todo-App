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
	            this.transitionTo('edituser', null, {id: userId});
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
								this.firebaseDb.push({ uid: this.state.uid, first_name: this.state.first_name, last_name: this.state.last_name, email: this.state.email, 
									isAdmin: this.state.isAdmin, status: "created" });
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
		var emailRegex = /^[0-9a-zA-Z]+([0-9a-zA-Z]*[-._+])*[0-9a-zA-Z]+@[0-9a-zA-Z]+([-.][0-9a-zA-Z]+)*([0-9a-zA-Z]*[.])[a-zA-Z]{2,6}$/;

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
		return <div id='changeData-form'>
				<fieldset>
					<form onSubmit={this.createUser} >
			           <input type='text' placeholder='First name' value={this.state.first_name} onChange={this.inputFirstNameTextChange} />
			           <div className='errorMessage'>{this.state.firstNameMessage}</div>
			           <input type='text' placeholder='Last name' value={this.state.last_name} onChange={this.inputLastNameTextChange} />
			           <div className='errorMessage'>{this.state.lastNameMessage}</div>
			           <input type='text' placeholder='Email' value={this.state.email} onChange={this.inputEmailTextChange} />
			           <div className='errorMessage'>{this.state.emailMessage}</div>
				       <div className='paddingAll'><span className='adminFont'>Administrator</span>
				           <input type='checkbox' checked={this.state.isAdmin} onChange={this.inputIsAdminChange} />
				       </div>
	                   <input type='submit' value='Add new user'/>
					</form>
				 </fieldset>
				<div className='errorMessage paddingLeft'>{this.state.message}</div>
				</div>;
	}
});

export default NewUser;