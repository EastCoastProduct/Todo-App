import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

let ChangePassword = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
		return { id: this.props.query.id, message: '', email: '', oldPassword: '', newPassword: '' };
	},

	componentWillMount() {
		this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/');
		this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.state.id);
    },

    componentWillUnmount() {
    	this.firebaseDb.off();
    	this.userFb.off();
    },

	inputEmailTextChange(e){
		this.setState({email: e.target.value, emailMessage: '', message: '' });
	},

	inputOldPasswordTextChange(e){
		this.setState({oldPassword: e.target.value, oldPasswordMessage: '', message: '' });
	},

	inputNewPasswordTextChange(e){
		this.setState({newPassword: e.target.value, newPasswordMessage: '', message: '' });
	},

	changePassword(e){
		e.preventDefault();
		this.handleValidation(res => {
			if(res){
				this.userFb.once("value", function(snap){
					var userData = snap.val();
					if(userData.email != this.state.email){
						this.setState({message: "The specified email address is incorrect."});
					} else {
						this.firebaseDb.changePassword({
							email: this.state.email,
							oldPassword: this.state.oldPassword,
							newPassword: this.state.newPassword
						}, function(error){
							if(error) {
								switch (error.code) {
									case "INVALID_PASSWORD":
										this.setState({message: "The specified user account password is incorrect."});
									break;
									case "INVALID_USER":
										this.setState({message: "The specified user account does not exist."});
									break;
									default:
									this.setState({message: "Error changing password."});
								}
							} else {
								this.userFb.once("value", function(snap){
									var userData = snap.val();
									if(userData.status == "created"){
										this.userFb.update({
											status: "active"
										})
										localStorage.userStatus = "active";
										this.transitionTo('myaccount');
									} else {
										this.transitionTo('myaccount');
									}
								}.bind(this))
							}
						}.bind(this))
					}
				}.bind(this))
			}
		})
	},

	cancel(){
		this.transitionTo('myaccount');
	},

	handleValidation(response){
		response = arguments[arguments.length - 1];
		var err = false;
		var emailRegex = /^[a-z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)?@[a-z][a-zA-Z-0-9]*\.[a-z]+(\.[a-z]+)?$/;
		var passwordRegex = /^(?=.*\d)[0-9a-zA-Z]{6,}$/;
		if(!emailRegex.test(this.state.email)){
			this.setState({ emailMessage: 'Enter a valid email address.' }); 
			err = true;
		}
		if(this.state.oldPassword.trim().length == 0){
			this.setState({ oldPasswordMessage: 'Enter current password.' });
			err = true;
		}
		if(!passwordRegex.test(this.state.newPassword)){
			this.setState({ newPasswordMessage: 'Your password must contain at least 6 characters and at least one number.' }); 
			err = true;
		}
		if(err){ response (false); return; } else { response (true); return; }
	},

	render(){
		return <div>
				<form onSubmit={this.changePassword} >
					<div><span>E-mail:</span>
						<input type = 'text' value = { this.state.email } onChange = {this.inputEmailTextChange} />
						<div>{this.state.emailMessage}</div>
					</div>
					<div><span>Old password:</span>
						<input type = 'password' value = { this.state.oldPassword } onChange = {this.inputOldPasswordTextChange} />
						<div>{this.state.oldPasswordMessage}</div>
					</div>
					<div><span>New password:</span>
						<input type = 'password' value = { this.state.newPassword } onChange = {this.inputNewPasswordTextChange} />
						<div>{this.state.newPasswordMessage}</div>
					</div>
					<div><span><button>Save</button></span></div>
				</form>
				<div><span><button onClick = {this.cancel}>Cancel</button></span></div>
				<div>{this.state.message}</div>
			</div>
	}
});

module.exports = ChangePassword;